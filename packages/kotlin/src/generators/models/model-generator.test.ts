import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { type ApiSchema, defaultOpenApiGeneratorConfig } from '@goast/core';

import { KotlinFileBuilder } from '../../file-builder.ts';
import { DefaultKotlinModelGenerator } from './model-generator.ts';
import { defaultKotlinModelsGeneratorConfig } from './models.ts';
import type { KotlinModelGeneratorContext } from './models.ts';

const config = { ...defaultOpenApiGeneratorConfig, ...defaultKotlinModelsGeneratorConfig };

/**
 * The only context members the declaration path reads: the config, and the schema list
 * `shouldGenerateTypeDeclaration` consults to decide whether a schema gets a type of its own.
 */
function createContext(schemas: ApiSchema[] = []): KotlinModelGeneratorContext {
  return { config, data: { schemas } } as unknown as KotlinModelGeneratorContext;
}

/** A schema carrying just enough for the enum declaration path. */
function createEnumSchema(name: string, values: unknown[]): ApiSchema {
  return {
    name,
    enum: values,
    kind: 'string',
    type: 'string',
    deprecated: false,
    description: undefined,
    required: new Set<string>(),
  } as unknown as ApiSchema;
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

function createProperties(schemas: Record<string, ApiSchema>): Map<string, { name: string; schema: ApiSchema }> {
  return new Map(Object.entries(schemas).map(([name, schema]) => [name, { name, schema }]));
}

function createString(name: string): ApiSchema {
  return createSchema(name, { kind: 'string', type: 'string' });
}

/**
 * The shape of `ImplicitBase`/`ImplicitDog`/`ImplicitCat` in test/specs/v3/discriminator-variants.yml: a base
 * that declares `type: object`, its own discriminator property and a `oneOf` of the subtypes that `allOf` it.
 */
function createImplicitShape(): { base: ApiSchema; dog: ApiSchema; cat: ApiSchema; all: ApiSchema[] } {
  const base = createSchema('ImplicitBase', {
    // A schema with a `oneOf` keyword is of kind `oneOf` even when it also declares `type: object`.
    kind: 'oneOf',
    properties: createProperties({ petType: createString('petType') }),
    required: new Set(['petType']),
    discriminator: { propertyName: 'petType', mapping: {} },
  });
  const dog = createSchema('ImplicitDog', {
    kind: 'combined',
    allOf: [base, createSchema('dogOwn', { properties: createProperties({ breed: createString('breed') }) })],
  });
  const cat = createSchema('ImplicitCat', {
    kind: 'combined',
    allOf: [
      base,
      createSchema('catOwn', {
        properties: createProperties({ lives: createSchema('lives', { kind: 'integer', type: 'integer' }) }),
      }),
    ],
  });
  Object.assign(base, { oneOf: [dog, cat] });
  base.discriminator!.mapping = { ImplicitDog: dog, ImplicitCat: cat };
  dog.inheritedSchemas.push(base as never);
  cat.inheritedSchemas.push(base as never);
  return { base, dog, cat, all: [base, dog, cat] };
}

/**
 * The shape of `NestedDiscriminator`/`NestedDiscriminatorGroup`/`NestedDiscriminatorGroupA`: a discriminated
 * base that is itself a subtype of another discriminated base.
 */
function createNestedShape(): { root: ApiSchema; group: ApiSchema; groupA: ApiSchema; all: ApiSchema[] } {
  const root = createSchema('NestedDiscriminator', {
    kind: 'oneOf',
    properties: createProperties({ kind: createString('kind') }),
    required: new Set(['kind']),
    discriminator: { propertyName: 'kind', mapping: {} },
  });
  const group = createSchema('NestedDiscriminatorGroup', {
    kind: 'oneOf',
    allOf: [root],
    properties: createProperties({ groupKind: createString('groupKind') }),
    required: new Set(['groupKind']),
    discriminator: { propertyName: 'groupKind', mapping: {} },
  });
  const groupA = createSchema('NestedDiscriminatorGroupA', {
    kind: 'combined',
    allOf: [
      group,
      createSchema('groupAOwn', { properties: createProperties({ groupAValue: createString('groupAValue') }) }),
    ],
  });
  Object.assign(root, { oneOf: [group] });
  Object.assign(group, { oneOf: [groupA] });
  root.discriminator!.mapping = { NestedDiscriminatorGroup: group };
  group.discriminator!.mapping = { NestedDiscriminatorGroupA: groupA };
  groupA.inheritedSchemas.push(group as never);
  return { root, group, groupA, all: [root, group, groupA] };
}

class TestModelGenerator extends DefaultKotlinModelGenerator {
  public renderEnum(name: string, values: unknown[]): string {
    const builder = new KotlinFileBuilder('com.test', config);
    builder.append(this.getEnum(createContext(), { schema: createEnumSchema(name, values) }));
    return builder.toString(false);
  }

  public findProperty(schema: ApiSchema, propertyName: string): boolean {
    return this.hasProperty(createContext(), { schema, propertyName });
  }

  public renderEnumDefault(name: string, values: unknown[], defaultValue: unknown): string {
    const schema = createEnumSchema(name, values) as ApiSchema & { default: unknown };
    schema.default = defaultValue;
    // Same package as the generated model, so the reference renders unqualified and without an import.
    const builder = new KotlinFileBuilder(`${config.packageName}${config.packageSuffix}`, config);
    builder.append(this.getDefaultValue(createContext(), { schema }));
    return builder.toString(false).replace(/^package [^\n]*\n\s*/, '');
  }

  /** The declaration the generator would write to the schema's own file. */
  public renderDeclaration(schema: ApiSchema, all: ApiSchema[]): string {
    const ctx = createContext(all);
    const builder = new KotlinFileBuilder(`${config.packageName}${config.packageSuffix}`, config);
    builder.append(this.getSchemaDeclaration(ctx, { schema: this.normalizeSchema(ctx, { schema }) }));
    return builder.toString(false);
  }
}

/** Every `NAME("raw"),` entry line of a rendered enum, in declaration order. */
function enumEntries(code: string): { name: string; value: string }[] {
  return [...code.matchAll(/^ {4}([^\s(]*)\("((?:[^"\\]|\\.)*)"\)[,;]$/gm)]
    .map((m) => ({ name: m[1], value: m[2] }));
}

/** Every `"raw" -> RESULT` branch of the `fromValue` companion, in declaration order. */
function whenBranches(code: string): { value: string; result: string }[] {
  return [...code.matchAll(/^ {16}"((?:[^"\\]|\\.)*)" ->(.*)$/gm)]
    .map((m) => ({ value: m[1], result: m[2].trim() }));
}

/** Every `val` declaration of a rendered interface or class body, in declaration order. */
function valDeclarations(code: string): { name: string; override: boolean }[] {
  return [...code.matchAll(/^ {4}(override )?val (\w+):/gm)].map((m) => ({ name: m[2], override: !!m[1] }));
}

const KOTLIN_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

describe('DefaultKotlinModelGenerator', () => {
  describe('getEnum', () => {
    it('gives every enum value a valid, non-empty, distinct constant name', () => {
      const code = new TestModelGenerator().renderEnum('IntEnum', [1, 2, '']);
      const entries = enumEntries(code);

      expect(entries.map((e) => e.value)).toEqual(['1', '2', '']);
      for (const entry of entries) {
        expect(entry.name).toMatch(KOTLIN_IDENTIFIER);
      }
      // An identifier made only of underscores is reserved in Kotlin.
      for (const entry of entries) {
        expect(entry.name).not.toMatch(/^_+$/);
      }
      expect(new Set(entries.map((e) => e.name)).size).toBe(entries.length);
    });

    it('gives every "when" branch of "fromValue" a result', () => {
      const code = new TestModelGenerator().renderEnum('IntEnum', [1, 2, '']);
      const branches = whenBranches(code);

      expect(branches.map((b) => b.value)).toEqual(['1', '2', '']);
      for (const branch of branches) {
        expect(branch.result).not.toBe('');
      }
    });

    it('routes the constant and the "when" branch through one name', () => {
      const code = new TestModelGenerator().renderEnum('MixedEnum', [1, 2, '', 'one', 'has space']);
      const entries = enumEntries(code);
      const branches = whenBranches(code);

      expect(branches.map((b) => b.value)).toEqual(entries.map((e) => e.value));
      expect(branches.map((b) => b.result)).toEqual(entries.map((e) => e.name));
    });

    it('keeps the derived names deterministic', () => {
      const code = new TestModelGenerator().renderEnum('IntEnum', [1, 2, 1.1, '']);

      expect(enumEntries(code)).toEqual([
        { name: '_1', value: '1' },
        { name: '_2', value: '2' },
        { name: '_1_1', value: '1.1' },
        { name: '_EMPTY', value: '' },
      ]);
    });

    it('does not collide two raw values onto one constant name', () => {
      const code = new TestModelGenerator().renderEnum('CollidingEnum', [2, '2', 2.0]);
      const entries = enumEntries(code);

      expect(entries).toHaveLength(3);
      expect(new Set(entries.map((e) => e.name)).size).toBe(3);
      expect(whenBranches(code).map((b) => b.result)).toEqual(entries.map((e) => e.name));
    });

    it('leaves names that already case cleanly untouched', () => {
      const code = new TestModelGenerator().renderEnum('EnumWithSpecialChars', ['has space', 'class', 'Thing2']);

      expect(enumEntries(code).map((e) => e.name)).toEqual(['HAS_SPACE', 'CLASS', 'THING_2']);
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
    it("declares only the base's own properties on the base interface", () => {
      const { base, all } = createImplicitShape();

      expect(valDeclarations(new TestModelGenerator().renderDeclaration(base, all)))
        .toEqual([{ name: 'petType', override: false }]);
    });

    it('gives a subtype every property its base declares, as an override', () => {
      const { dog, all } = createImplicitShape();

      expect(valDeclarations(new TestModelGenerator().renderDeclaration(dog, all))).toEqual([
        { name: 'breed', override: false },
        { name: 'petType', override: true },
      ]);
    });

    it("defaults the discriminator property to the subtype's mapping key", () => {
      const { dog, cat, all } = createImplicitShape();
      const generator = new TestModelGenerator();

      expect(generator.renderDeclaration(dog, all)).toContain('override val petType: String = "ImplicitDog"');
      expect(generator.renderDeclaration(cat, all)).toContain('override val petType: String = "ImplicitCat"');
    });

    it("does not give a subtype its siblings' properties", () => {
      const { dog, cat, all } = createImplicitShape();
      const generator = new TestModelGenerator();

      expect(valDeclarations(generator.renderDeclaration(dog, all)).map((v) => v.name)).not.toContain('lives');
      expect(valDeclarations(generator.renderDeclaration(cat, all)).map((v) => v.name)).not.toContain('breed');
    });

    it("carries the properties of a nested base's own base down to the leaf subtype", () => {
      const { group, groupA, all } = createNestedShape();
      const generator = new TestModelGenerator();

      // The intermediate base declares both its own discriminator and the one it inherits...
      expect(valDeclarations(generator.renderDeclaration(group, all))).toEqual([
        { name: 'groupKind', override: false },
        { name: 'kind', override: false },
      ]);
      // ...so its subtype has to implement both.
      expect(valDeclarations(generator.renderDeclaration(groupA, all))).toEqual([
        { name: 'kind', override: true },
        { name: 'groupAValue', override: false },
        { name: 'groupKind', override: true },
      ]);
    });

    it('still composes an undiscriminated oneOf into the schema that declares it', () => {
      const holder = createSchema('Holder', {
        kind: 'oneOf',
        oneOf: [
          createSchema('BranchA', { properties: createProperties({ a: createString('a') }) }),
          createSchema('BranchB', { properties: createProperties({ b: createString('b') }) }),
        ],
      });

      expect(valDeclarations(new TestModelGenerator().renderDeclaration(holder, [holder])).map((v) => v.name))
        .toEqual(['a', 'b']);
    });
  });

  describe('getDefaultValue', () => {
    it('references the constant the enum actually declares for a numeric default', () => {
      const generator = new TestModelGenerator();
      const values = [1, 2, 3];

      const declared = enumEntries(generator.renderEnum('IntEnum', values));
      const reference = generator.renderEnumDefault('IntEnum', values, 2);

      expect(reference).toBe(`IntEnum.${declared[1].name}`);
      expect(reference).toBe('IntEnum._2');
    });

    it('references the constant the enum actually declares for a string default', () => {
      const generator = new TestModelGenerator();

      expect(generator.renderEnumDefault('DefaultEnum', ['one', 'two'], 'one')).toBe('DefaultEnum.ONE');
    });
  });
});
