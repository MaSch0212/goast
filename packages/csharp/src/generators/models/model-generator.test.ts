import { describe, expect, it } from 'vitest';

import { type ApiSchema, defaultOpenApiGeneratorConfig } from '@goast/core';

import { CSharpFileBuilder } from '../../file-builder.ts';
import { DefaultCSharpModelGenerator } from './model-generator.ts';
import { defaultCSharpModelsGeneratorConfig } from './models.ts';
import type { CSharpModelGeneratorContext } from './models.ts';

const config = { ...defaultOpenApiGeneratorConfig, ...defaultCSharpModelsGeneratorConfig, newLine: '\n' };
const namespace = `${config.rootNamespace}${config.namespaceSuffix}`;

/**
 * The only context members the declaration path reads: the config, and the schema list
 * `shouldGenerateTypeDeclaration` consults to decide whether a schema gets a type of its own.
 */
function createContext(
  schemas: ApiSchema[] = [],
  configOverrides: Partial<typeof config> = {},
): CSharpModelGeneratorContext {
  return { config: { ...config, ...configOverrides }, data: { schemas } } as unknown as CSharpModelGeneratorContext;
}

let schemaId = 0;

/** A schema carrying every member the model generator reads, defaulting to an empty object schema. */
function createSchema(name: string, overrides: Record<string, unknown> = {}): ApiSchema {
  schemaId++;
  return {
    $src: {
      file: 'discriminator.yml',
      path: `/components/schemas/${name}`,
      pos: { line: 1, col: 1 },
      originalComponent: {},
    },
    $ref: undefined,
    id: `schema-${schemaId}`,
    name,
    isNameGenerated: false,
    description: undefined,
    deprecated: false,
    accessibility: 'all',
    enum: undefined,
    const: undefined,
    default: undefined,
    example: undefined,
    nullable: false,
    required: new Set<string>(),
    custom: {},
    not: undefined,
    discriminator: undefined,
    inheritedSchemas: [],
    kind: 'object',
    type: 'object',
    properties: new Map(),
    additionalProperties: undefined,
    allOf: [],
    anyOf: [],
    oneOf: [],
    ...overrides,
  } as unknown as ApiSchema;
}

function createEnumSchema(name: string, values: unknown[], overrides: Record<string, unknown> = {}): ApiSchema {
  return createSchema(name, { kind: 'string', type: 'string', enum: values, ...overrides });
}

function createProperties(schemas: Record<string, ApiSchema>): Map<string, { name: string; schema: ApiSchema }> {
  return new Map(Object.entries(schemas).map(([name, schema]) => [name, { name, schema }]));
}

function createString(name: string, overrides: Record<string, unknown> = {}): ApiSchema {
  return createSchema(name, { kind: 'string', type: 'string', ...overrides });
}

function createInteger(name: string, overrides: Record<string, unknown> = {}): ApiSchema {
  return createSchema(name, { kind: 'integer', type: 'integer', ...overrides });
}

/**
 * The shape of `ImplicitBase`/`ImplicitDog`/`ImplicitCat` in test/specs/v3/discriminator-variants.yml: a base
 * that declares `type: object`, its own discriminator property and a `oneOf` of the subtypes that `allOf` it.
 */
function createImplicitShape(): { base: ApiSchema; dog: ApiSchema; cat: ApiSchema; all: ApiSchema[] } {
  const base = createSchema('ImplicitBase', {
    // A schema with a `oneOf` keyword is of kind `oneOf` even when it also declares `type: object`.
    kind: 'oneOf',
    properties: createProperties({ petType: createString('petType'), name: createString('name') }),
    required: new Set(['petType', 'name']),
    discriminator: { propertyName: 'petType', mapping: {} },
  });
  const dog = createSchema('ImplicitDog', {
    kind: 'combined',
    allOf: [base, createSchema('dogOwn', { properties: createProperties({ breed: createString('breed') }) })],
  });
  const cat = createSchema('ImplicitCat', {
    kind: 'combined',
    allOf: [base, createSchema('catOwn', { properties: createProperties({ lives: createInteger('lives') }) })],
  });
  Object.assign(base, { oneOf: [dog, cat] });
  base.discriminator!.mapping = { dog, cat };
  dog.inheritedSchemas.push(base as never);
  cat.inheritedSchemas.push(base as never);
  return { base, dog, cat, all: [base, dog, cat] };
}

/**
 * A discriminated base that declares no properties of its own, because the discriminator property is declared
 * on the mapping targets instead. Legal OpenAPI.
 */
function createPropertylessShape(): { base: ApiSchema; sub: ApiSchema; all: ApiSchema[] } {
  const base = createSchema('PropertylessBase', {
    kind: 'oneOf',
    discriminator: { propertyName: 'kind', mapping: {} },
  });
  const sub = createSchema('PropertylessSub', {
    kind: 'combined',
    allOf: [
      base,
      createSchema('subOwn', {
        properties: createProperties({ kind: createString('kind'), subValue: createString('subValue') }),
        required: new Set(['kind']),
      }),
    ],
  });
  Object.assign(base, { oneOf: [sub] });
  base.discriminator!.mapping = { sub };
  sub.inheritedSchemas.push(base as never);
  return { base, sub, all: [base, sub] };
}

class TestModelGenerator extends DefaultCSharpModelGenerator {
  public renderEnum(schema: ApiSchema, all: ApiSchema[] = [schema]): string {
    const ctx = createContext(all);
    const builder = new CSharpFileBuilder(namespace, ctx.config);
    builder.append(this.getEnum(ctx, { schema }));
    return builder.toString(false);
  }

  public findProperty(schema: ApiSchema, propertyName: string): boolean {
    return this.hasProperty(createContext(), { schema, propertyName });
  }

  /** The declaration the generator would write to the schema's own file. */
  public renderDeclaration(schema: ApiSchema, all: ApiSchema[], configOverrides: Partial<typeof config> = {}): string {
    const ctx = createContext(all, configOverrides);
    const builder = new CSharpFileBuilder(namespace, ctx.config);
    builder.append(this.getSchemaDeclaration(ctx, { schema: this.normalizeSchema(ctx, { schema }) }));
    return builder.toString(false);
  }

  /** The complete content of the schema's own file, header and usings included. */
  public renderFile(schema: ApiSchema, all: ApiSchema[], configOverrides: Partial<typeof config> = {}): string {
    const ctx = createContext(all, configOverrides);
    ctx.schema = schema;
    const builder = new CSharpFileBuilder(namespace, ctx.config);
    builder.append(this.getFileContent(ctx, {}));
    return builder.toString();
  }

  public willDeclareType(schema: ApiSchema, all: ApiSchema[], configOverrides: Partial<typeof config> = {}): boolean {
    return this.shouldGenerateTypeDeclaration(createContext(all, configOverrides), { schema });
  }

  public typeName(schema: ApiSchema, all: ApiSchema[]): string {
    return this.getDeclarationTypeName(createContext(all), { schema });
  }

  /** The type reference the generator renders for a schema used as a value. */
  public renderType(schema: ApiSchema, all: ApiSchema[] = [], configOverrides: Partial<typeof config> = {}): string {
    const ctx = createContext(all, configOverrides);
    // Same namespace as the generated model, so a reference renders unqualified and without a using.
    const builder = new CSharpFileBuilder(namespace, ctx.config);
    builder.append(this.getType(ctx, { schema }));
    return builder.toString(false);
  }

  public renderDefault(schema: ApiSchema, all: ApiSchema[] = []): string | null {
    const ctx = createContext(all);
    const value = this.getDefaultValue(ctx, { schema });
    if (value === null) return null;
    const builder = new CSharpFileBuilder(namespace, ctx.config);
    builder.append(value);
    return builder.toString(false);
  }

  public normalize(schema: ApiSchema, all: ApiSchema[] = []): ApiSchema {
    return this.normalizeDiscriminatedBases(createContext(all), { schema });
  }
}

/** Every `Name { get; init; }` property declaration of a rendered record, in declaration order. */
function propertyDeclarations(code: string): { name: string; type: string; required: boolean }[] {
  return [...code.matchAll(/^ {4}(required )?(?:public )?(required )?(.+?) (@?\w+) \{ get; (?:init|set); \}/gm)].map(
    (m) => ({ name: m[4], type: m[3], required: !!(m[1] ?? m[2]) }),
  );
}

/** The `Name` and optional `= value` of every enum member. */
function enumMembers(code: string): { name: string; wire: string | null; value: string | null }[] {
  return [
    ...code.matchAll(/^ {4}(?:\[JsonStringEnumMemberName\("((?:[^"\\]|\\.)*)"\)\]\n {4})?(\w+)(?: = (.+?))?,?$/gm),
  ].map((m) => ({ name: m[2], wire: m[1] ?? null, value: m[3] ?? null }));
}

const CSHARP_IDENTIFIER = /^@?[\p{L}_][\p{L}\p{Nd}_]*$/u;

describe('DefaultCSharpModelGenerator', () => {
  describe('getEnum', () => {
    it('declares a string enum with the wire name of every member', () => {
      const code = new TestModelGenerator().renderEnum(createEnumSchema('Status', ['active', 'on-hold']));

      expect(code).toContain('[JsonConverter(typeof(JsonStringEnumConverter<Status>))]');
      expect(code).toContain('public enum Status');
      expect(enumMembers(code)).toEqual([
        { name: 'Active', wire: 'active', value: null },
        { name: 'OnHold', wire: 'on-hold', value: null },
      ]);
    });

    it('gives every enum value a valid, distinct member name', () => {
      const code = new TestModelGenerator().renderEnum(
        createEnumSchema('Odd', ['1', '', 'class', 'has space', 'Class']),
      );
      const members = enumMembers(code);

      expect(members.map((m) => m.wire)).toEqual(['1', '', 'class', 'has space', 'Class']);
      for (const member of members) {
        expect(member.name).toMatch(CSHARP_IDENTIFIER);
      }
      expect(new Set(members.map((m) => m.name)).size).toBe(members.length);
    });

    it('writes an integer enum with its numeric values and without a string converter', () => {
      const schema = createSchema('Level', { kind: 'integer', type: 'integer', enum: [1, 2, 3] });
      const code = new TestModelGenerator().renderEnum(schema);

      expect(code).not.toContain('JsonStringEnumConverter');
      expect(enumMembers(code)).toEqual([
        { name: '_1', wire: null, value: '1' },
        { name: '_2', wire: null, value: '2' },
        { name: '_3', wire: null, value: '3' },
      ]);
    });

    it('widens an int64 enum to long', () => {
      const schema = createSchema('Big', { kind: 'integer', type: 'integer', format: 'int64', enum: [1, 5000000000] });

      expect(new TestModelGenerator().renderEnum(schema)).toContain('public enum Big : long');
    });

    it('drops the null of a nullable enum from its members', () => {
      const code = new TestModelGenerator().renderEnum(createEnumSchema('Maybe', ['a', null]));

      expect(enumMembers(code).map((m) => m.wire)).toEqual(['a']);
    });

    it('marks a deprecated enum as obsolete', () => {
      const code = new TestModelGenerator().renderEnum(createEnumSchema('Old', ['a'], { deprecated: true }));

      expect(code).toContain('[Obsolete]');
    });
  });

  describe('shouldGenerateTypeDeclaration', () => {
    it('does not declare an enum C# cannot express', () => {
      const generator = new TestModelGenerator();
      const fractional = createSchema('NumEnum', { kind: 'number', type: 'number', enum: [1.1, 2.2] });
      const boolEnum = createSchema('BoolEnum', { kind: 'boolean', type: 'boolean', enum: [true] });
      const integer = createSchema('IntEnum', { kind: 'integer', type: 'integer', enum: [1, 2] });

      expect(generator.willDeclareType(fractional, [fractional])).toBe(false);
      expect(generator.willDeclareType(boolEnum, [boolEnum])).toBe(false);
      expect(generator.willDeclareType(integer, [integer])).toBe(true);
    });

    it('still degrades an undiscriminated empty object to JsonElement under use-any', () => {
      const empty = createSchema('EmptyObject');
      const generator = new TestModelGenerator();

      expect(generator.willDeclareType(empty, [empty], { emptyObjectTypeBehavior: 'use-any' })).toBe(false);
      expect(generator.willDeclareType(empty, [empty], { emptyObjectTypeBehavior: 'generate-empty-class' })).toBe(true);
    });

    it('does not declare an object that is only a dictionary', () => {
      const dictionary = createSchema('Dictionary', { additionalProperties: createString('value') });

      expect(new TestModelGenerator().willDeclareType(dictionary, [dictionary])).toBe(false);
    });
  });

  describe('getDeclarationTypeName', () => {
    it('keeps the names of schemas that case onto each other distinct', () => {
      const a = createSchema('my_thing');
      const b = createSchema('my-thing');
      const c = createSchema('MyThing');
      const generator = new TestModelGenerator();

      expect([a, b, c].map((s) => generator.typeName(s, [a, b, c]))).toEqual(['MyThing', 'MyThing_2', 'MyThing_3']);
    });

    it('does not count a schema that has no declaration against a name', () => {
      const primitive = createString('Thing');
      const declared = createSchema('thing');

      expect(new TestModelGenerator().typeName(declared, [primitive, declared])).toBe('Thing');
    });

    it('makes a name that cases to nothing a valid identifier', () => {
      const generator = new TestModelGenerator();
      const cyrillic = createSchema('Кириллица');
      const emoji = createSchema('😀');
      const all = [cyrillic, emoji];

      expect(generator.typeName(cyrillic, all)).toMatch(CSHARP_IDENTIFIER);
      expect(generator.typeName(emoji, all)).toMatch(CSHARP_IDENTIFIER);
    });

    it('escapes a name that is a C# keyword', () => {
      // `toCasing` pascal-cases `class` to `Class`, so an explicit camel casing is what exposes the keyword.
      const schema = createSchema('class');
      const ctx = createContext([schema], { typeNameCasing: 'camel' });

      expect(new TestModelGenerator()['getDeclarationTypeName'](ctx, { schema })).toBe('@class');
    });
  });

  describe('getType', () => {
    const generator = new TestModelGenerator();

    it('maps primitives and formats', () => {
      const cases: [Record<string, unknown>, string][] = [
        [{ kind: 'boolean', type: 'boolean' }, 'bool'],
        [{ kind: 'integer', type: 'integer' }, 'int'],
        [{ kind: 'integer', type: 'integer', format: 'int64' }, 'long'],
        [{ kind: 'number', type: 'number' }, 'double'],
        [{ kind: 'number', type: 'number', format: 'float' }, 'float'],
        [{ kind: 'number', type: 'number', format: 'decimal' }, 'decimal'],
        [{ kind: 'string', type: 'string', format: 'date-time' }, 'DateTimeOffset'],
        [{ kind: 'string', type: 'string', format: 'date' }, 'DateOnly'],
        [{ kind: 'string', type: 'string', format: 'time' }, 'TimeOnly'],
        [{ kind: 'string', type: 'string', format: 'uuid' }, 'Guid'],
        [{ kind: 'string', type: 'string', format: 'uri' }, 'Uri'],
        [{ kind: 'string', type: 'string', format: 'byte' }, 'byte[]'],
        [{ kind: 'string', type: 'string', format: 'binary' }, 'Stream'],
        [{ kind: 'string', type: 'string' }, 'string'],
        [{ kind: 'unknown' }, 'JsonElement'],
      ];
      for (const [overrides, expected] of cases) {
        expect(generator.renderType(createSchema('S', overrides))).toBe(expected);
      }
    });

    it('renders a nullable value type as Nullable<T> and a nullable reference type with a question mark', () => {
      expect(generator.renderType(createInteger('S', { nullable: true }))).toBe('int?');
      expect(generator.renderType(createString('S', { nullable: true }))).toBe('string?');
      expect(generator.renderType(createString('S', { format: 'date', nullable: true }))).toBe('DateOnly?');
    });

    it('renders a oneOf of a type and null as that type, nullable', () => {
      const schema = createSchema('S', {
        kind: 'oneOf',
        oneOf: [createString('a'), createSchema('n', { kind: 'null' })],
      });

      expect(generator.renderType(schema)).toBe('string?');
    });

    it('renders collections as read-only for immutable types', () => {
      const items = createString('Item', { nullable: true });
      const array = createSchema('Arr', { kind: 'array', type: 'array', items });
      const map = createSchema('Map', { additionalProperties: createInteger('Value') });

      expect(generator.renderType(array)).toBe('IReadOnlyList<string?>');
      expect(generator.renderType(map)).toBe('IReadOnlyDictionary<string, int>');
    });

    it('renders mutable collections when immutableTypes is off', () => {
      const items = createString('Item');
      const array = createSchema('Arr', { kind: 'array', type: 'array', items });
      const map = createSchema('Map', { additionalProperties: createInteger('Value', { nullable: true }) });

      expect(generator.renderType(array, [], { immutableTypes: false })).toBe('List<string>');
      expect(generator.renderType(map, [], { immutableTypes: false })).toBe('Dictionary<string, int?>');
    });

    it('renders a reference to a declared nullable schema as nullable', () => {
      const declared = createEnumSchema('MyEnum', ['a', 'b'], { nullable: true });
      const items = createSchema('Items', { kind: 'array', type: 'array', items: declared });

      expect(generator.renderType(items, [declared])).toBe('IReadOnlyList<MyEnum?>');
    });
  });

  describe('getDefaultValue', () => {
    const generator = new TestModelGenerator();

    it('writes constants for primitive defaults', () => {
      expect(generator.renderDefault(createString('S', { default: 'a"b' }))).toBe('"a\\"b"');
      expect(generator.renderDefault(createInteger('S', { default: 3 }))).toBe('3');
      expect(generator.renderDefault(createSchema('S', { kind: 'boolean', type: 'boolean', default: true }))).toBe(
        'true',
      );
      expect(
        generator.renderDefault(createSchema('S', { kind: 'number', type: 'number', format: 'float', default: 1.5 })),
      ).toBe('1.5f');
      expect(
        generator.renderDefault(createSchema('S', { kind: 'number', type: 'number', format: 'decimal', default: 1.5 })),
      ).toBe('1.5m');
    });

    it('references the member the enum declares', () => {
      const stringEnum = createEnumSchema('DefaultEnum', ['one', 'two'], { default: 'two' });
      const intEnum = createSchema('IntEnum', { kind: 'integer', type: 'integer', enum: [1, 2], default: 2 });

      expect(generator.renderDefault(stringEnum, [stringEnum])).toBe('DefaultEnum.Two');
      expect(generator.renderDefault(intEnum, [intEnum])).toBe('IntEnum._2');
    });

    it('writes an array default as a collection expression', () => {
      const items = createString('Item');
      const schema = createSchema('Arr', { kind: 'array', type: 'array', items, default: ['a', 'b'] });

      expect(generator.renderDefault(schema)).toBe('["a", "b"]');
    });

    it('has no initializer for a default a constant cannot express', () => {
      expect(generator.renderDefault(createString('S', { format: 'date-time', default: '2020-01-01T00:00:00Z' }))).toBe(
        null,
      );
      expect(generator.renderDefault(createSchema('S', { default: {} }))).toBe(null);
      expect(generator.renderDefault(createString('S', { default: null }))).toBe(null);
    });
  });

  describe('records', () => {
    function render(properties: Record<string, ApiSchema>, required: string[] = [], overrides = {}): string {
      const schema = createSchema('Pet', { properties: createProperties(properties), required: new Set(required) });
      return new TestModelGenerator().renderDeclaration(schema, [schema], overrides);
    }

    it('writes a required property with the required keyword', () => {
      const code = render({ name: createString('name') }, ['name']);

      expect(code).toContain('[JsonPropertyName("name")]');
      expect(propertyDeclarations(code)).toEqual([{ name: 'Name', type: 'string', required: true }]);
      expect(code).not.toContain('JsonIgnore');
    });

    it('writes an optional property as nullable and omits it when null', () => {
      const code = render({ age: createInteger('age'), nick: createString('nick') });

      expect(propertyDeclarations(code)).toEqual([
        { name: 'Age', type: 'int?', required: false },
        { name: 'Nick', type: 'string?', required: false },
      ]);
      expect(code.match(/\[JsonIgnore\(Condition = JsonIgnoreCondition\.WhenWritingNull\)\]/g)).toHaveLength(2);
    });

    it('writes a required nullable property as required and nullable, and always writes it', () => {
      const code = render({ value: createString('value', { nullable: true }) }, ['value']);

      expect(propertyDeclarations(code)).toEqual([{ name: 'Value', type: 'string?', required: true }]);
      expect(code).not.toContain('JsonIgnore');
    });

    it('turns a default into an initializer instead of a required or nullable property', () => {
      const code = render({ size: createInteger('size', { default: 5 }) }, ['size']);

      expect(code).toContain('public int Size { get; init; } = 5;');
      expect(code).not.toContain('required');
      expect(code).not.toContain('JsonIgnore');
    });

    it('declares mutable properties with a setter when immutableTypes is off', () => {
      const code = render({ tags: createSchema('tags', { kind: 'array', type: 'array', items: createString('t') }) }, [
        'tags',
      ]);
      const mutable = render(
        { tags: createSchema('tags', { kind: 'array', type: 'array', items: createString('t') }) },
        ['tags'],
        { immutableTypes: false },
      );

      expect(code).toContain('public required IReadOnlyList<string> Tags { get; init; }');
      expect(mutable).toContain('public required List<string> Tags { get; set; }');
    });

    it('declares a sealed record', () => {
      expect(render({})).toContain('public sealed record Pet;');
    });

    it('sorts required properties before the ones with defaults before the optional ones', () => {
      const code = render(
        { opt: createString('opt'), def: createString('def', { default: 'x' }), req: createString('req') },
        ['req'],
      );

      expect(propertyDeclarations(code).map((p) => p.name)).toEqual(['Req', 'Def', 'Opt']);
    });

    it('never names a property like its record, or like a member every record has', () => {
      const code = render({ pet: createString('pet'), toString: createString('toString'), x: createString('x') });
      const names = propertyDeclarations(code).map((p) => p.name);

      expect(names).not.toContain('Pet');
      expect(names).not.toContain('ToString');
      expect(names).toEqual(['PetValue', 'ToStringValue', 'X']);
    });

    it('keeps the names of properties that case onto each other distinct', () => {
      const code = render({ foo_bar: createString('foo_bar'), fooBar: createString('fooBar') });

      expect(propertyDeclarations(code).map((p) => p.name)).toEqual(['FooBar', 'FooBar_2']);
      expect(code).toContain('[JsonPropertyName("foo_bar")]');
      expect(code).toContain('[JsonPropertyName("fooBar")]');
    });

    it('escapes a property named like a keyword and names one that cases to nothing', () => {
      const code = render({ class: createString('class'), '😀': createString('😀') }, [], {
        propertyNameCasing: 'camel',
      });
      const names = propertyDeclarations(code).map((p) => p.name);

      expect(names[0]).toBe('@class');
      for (const name of names) expect(name).toMatch(CSHARP_IDENTIFIER);
    });

    it('declares extension data for additional properties', () => {
      const code = render({ a: createString('a') }, [], {});
      const schema = createSchema('Open', {
        properties: createProperties({ a: createString('a') }),
        additionalProperties: true,
      });
      const withExtra = new TestModelGenerator().renderDeclaration(schema, [schema]);

      expect(code).not.toContain('JsonExtensionData');
      expect(withExtra).toContain('[JsonExtensionData]');
      expect(withExtra).toContain('public IDictionary<string, JsonElement>? AdditionalProperties { get; init; }');
    });

    it('documents a record and its properties and marks deprecated ones as obsolete', () => {
      const schema = createSchema('Pet', {
        description: 'A <pet> & friend',
        properties: createProperties({ name: createString('name', { description: 'The name', deprecated: true }) }),
      });
      const code = new TestModelGenerator().renderDeclaration(schema, [schema]);

      expect(code).toContain('/// A &lt;pet&gt; &amp; friend');
      expect(code).toContain('/// The name');
      expect(code).toContain('[Obsolete]');
    });

    it('suppresses the obsolete warnings of a file that refers to an obsolete model', () => {
      const old = createEnumSchema('Old', ['a'], { deprecated: true });
      const user = createSchema('User', { properties: createProperties({ old }) });
      const generator = new TestModelGenerator();

      expect(generator.renderFile(user, [old, user])).toContain('#pragma warning disable CS0612, CS0618');
      expect(generator.renderFile(old, [old, user])).not.toContain('#pragma');
    });
  });

  describe('data annotations', () => {
    function renderProperty(schema: ApiSchema, overrides = {}): string {
      const owner = createSchema('Owner', { properties: createProperties({ value: schema }) });
      return new TestModelGenerator().renderDeclaration(owner, [owner], overrides);
    }

    it('adds string constraints', () => {
      const code = renderProperty(
        createString('value', { format: 'email', pattern: '^a+$', minLength: 1, maxLength: 5 }),
      );

      expect(code).toContain('[EmailAddress]');
      expect(code).toContain('[RegularExpression("^a+$")]');
      expect(code).toContain('[StringLength(5, MinimumLength = 1)]');
    });

    it('uses MinLength or MaxLength for a one-sided string or array constraint', () => {
      expect(renderProperty(createString('value', { minLength: 2 }))).toContain('[MinLength(2)]');
      expect(renderProperty(createString('value', { maxLength: 9 }))).toContain('[MaxLength(9)]');
      expect(
        renderProperty(createSchema('value', { kind: 'array', type: 'array', items: createString('i'), minItems: 1 })),
      ).toContain('[MinLength(1)]');
    });

    it('adds a range with a bound of the right type for each missing side', () => {
      expect(renderProperty(createInteger('value', { minimum: 0 }))).toContain('[Range(0, int.MaxValue)]');
      expect(renderProperty(createInteger('value', { maximum: 10 }))).toContain('[Range(int.MinValue, 10)]');
      expect(
        renderProperty(createSchema('value', { kind: 'number', type: 'number', minimum: 0, maximum: 1.5 })),
      ).toContain('[Range(0.0, 1.5)]');
      expect(renderProperty(createInteger('value', { format: 'int64', minimum: 0 }))).toContain(
        '[Range(0.0, double.MaxValue)]',
      );
    });

    it('adds no annotations when they are disabled', () => {
      const code = renderProperty(createString('value', { minLength: 1 }), { addDataAnnotations: false });

      expect(code).not.toContain('MinLength');
    });
  });

  describe('hasProperty', () => {
    /** The shape of test/specs/v3/anyof-cycle.yml: the holder's anyOf branch allOf's back to the holder. */
    function createCycle(): ApiSchema {
      const holder = {
        kind: 'object',
        properties: new Map([['kind', { name: 'kind', schema: { kind: 'string' } }]]),
        allOf: [],
        anyOf: [] as unknown[],
      };
      holder.anyOf.push({
        kind: 'combined',
        allOf: [holder, { kind: 'object', properties: new Map(), allOf: [], anyOf: [] }],
        anyOf: [],
      });
      return holder as unknown as ApiSchema;
    }

    it('terminates when a composition cycles back to its own holder', () => {
      const generator = new TestModelGenerator();

      expect(generator.findProperty(createCycle(), 'kind')).toBe(true);
      expect(generator.findProperty(createCycle(), 'missing')).toBe(false);
    });
  });

  describe('discriminated oneOf subtypes', () => {
    it('declares the base as an abstract record carrying the polymorphism attributes', () => {
      const { base, all } = createImplicitShape();
      const code = new TestModelGenerator().renderDeclaration(base, all);

      expect(code).toContain('[JsonPolymorphic(TypeDiscriminatorPropertyName = "petType")]');
      expect(code).toContain('[JsonDerivedType(typeof(ImplicitDog), "dog")]');
      expect(code).toContain('[JsonDerivedType(typeof(ImplicitCat), "cat")]');
      expect(code).toContain('public abstract record ImplicitBase');
    });

    it('does not declare the discriminator property, which System.Text.Json writes itself', () => {
      const { base, dog, all } = createImplicitShape();
      const generator = new TestModelGenerator();

      expect(propertyDeclarations(generator.renderDeclaration(base, all)).map((p) => p.name)).toEqual(['Name']);
      expect(generator.renderDeclaration(dog, all)).not.toContain('PetType');
    });

    it("derives a subtype from its base and declares only the subtype's own properties", () => {
      const { dog, cat, all } = createImplicitShape();
      const generator = new TestModelGenerator();

      const dogCode = generator.renderDeclaration(dog, all);
      expect(dogCode).toContain('public sealed record ImplicitDog : ImplicitBase');
      expect(propertyDeclarations(dogCode).map((p) => p.name)).toEqual(['Breed']);
      expect(propertyDeclarations(generator.renderDeclaration(cat, all)).map((p) => p.name)).toEqual(['Lives']);
    });

    it('derives from the first base and declares what the other bases add itself', () => {
      const first = createSchema('First', {
        kind: 'oneOf',
        properties: createProperties({ a: createString('a'), kind: createString('kind') }),
        discriminator: { propertyName: 'kind', mapping: {} },
      });
      const second = createSchema('Second', {
        kind: 'oneOf',
        properties: createProperties({ b: createString('b'), shape: createString('shape') }),
        discriminator: { propertyName: 'shape', mapping: {} },
      });
      const both = createSchema('Both', { kind: 'combined', allOf: [first, second] });
      Object.assign(first, { oneOf: [both] });
      Object.assign(second, { oneOf: [both] });
      first.discriminator!.mapping = { both };
      second.discriminator!.mapping = { both };
      both.inheritedSchemas.push(first as never, second as never);
      const all = [first, second, both];

      const code = new TestModelGenerator().renderDeclaration(both, all);
      expect(code).toContain('public sealed record Both : First');
      expect(propertyDeclarations(code).map((p) => p.name)).toEqual(['B']);
    });

    it('keeps a base that declares no properties of its own declared under every emptyObjectTypeBehavior', () => {
      const { base, sub, all } = createPropertylessShape();
      const generator = new TestModelGenerator();

      for (const emptyObjectTypeBehavior of ['generate-empty-class', 'use-any'] as const) {
        expect(generator.willDeclareType(base, all, { emptyObjectTypeBehavior })).toBe(true);
        expect(generator.renderDeclaration(base, all, { emptyObjectTypeBehavior })).toContain(
          'abstract record PropertylessBase',
        );
        expect(generator.renderDeclaration(sub, all, { emptyObjectTypeBehavior })).toContain(
          'sealed record PropertylessSub : PropertylessBase',
        );
      }
    });

    it('leaves a schema whose composition holds no discriminated base untouched', () => {
      const branch = createSchema('Branch', { properties: createProperties({ a: createString('a') }) });
      const composed = createSchema('Composed', { kind: 'combined', allOf: [branch] });

      // Not merely equal — the identical object, so the walk cannot be allocating a copy per composing schema.
      expect(new TestModelGenerator().normalize(composed)).toBe(composed);
    });

    it('still composes an undiscriminated oneOf into the schema that declares it', () => {
      const holder = createSchema('Holder', {
        kind: 'oneOf',
        oneOf: [
          createSchema('BranchA', { properties: createProperties({ a: createString('a') }) }),
          createSchema('BranchB', { properties: createProperties({ b: createString('b') }) }),
        ],
      });

      expect(
        propertyDeclarations(new TestModelGenerator().renderDeclaration(holder, [holder])).map((p) => p.name),
      ).toEqual(['A', 'B']);
    });
  });
});
