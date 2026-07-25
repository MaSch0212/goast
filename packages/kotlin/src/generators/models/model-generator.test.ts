import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { type ApiSchema, defaultOpenApiGeneratorConfig } from '@goast/core';

import { KotlinFileBuilder } from '../../file-builder.ts';
import { DefaultKotlinModelGenerator } from './model-generator.ts';
import { defaultKotlinModelsGeneratorConfig } from './models.ts';
import type { KotlinModelGeneratorContext } from './models.ts';

const config = { ...defaultOpenApiGeneratorConfig, ...defaultKotlinModelsGeneratorConfig };

/** The only context members `getEnum` and its helpers read. */
function createContext(): KotlinModelGeneratorContext {
  return { config } as unknown as KotlinModelGeneratorContext;
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
