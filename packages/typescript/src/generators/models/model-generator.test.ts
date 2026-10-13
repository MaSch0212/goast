import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { ApiSchema, CombinedLikeApiSchema } from '@goast/core';

import { ts } from '../../ast/index.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { DefaultTypeScriptModelGenerator } from './model-generator.ts';

class TestableGenerator extends DefaultTypeScriptModelGenerator {
  /** Renders whatever the named protected member returns, so a test can assert on emitted source. */
  // deno-lint-ignore no-explicit-any
  private render(member: string, ctx: any, ...args: any[]): string {
    const builder = new TypeScriptFileBuilder();
    // deno-lint-ignore no-explicit-any
    builder.append((this as any)[member](ctx, ...args));
    return builder.toString(false);
  }

  // deno-lint-ignore no-explicit-any
  public callGetCombinedType(ctx: any, schema: any): string {
    return this.render('getCombinedType', ctx, schema);
  }

  // deno-lint-ignore no-explicit-any
  public callGetOneOfType(ctx: any, schema: any): string {
    return this.render('getOneOfType', ctx, schema);
  }

  // deno-lint-ignore no-explicit-any
  public callGetArrayType(ctx: any, schema: any): string {
    return this.render('getArrayType', ctx, schema);
  }

  // deno-lint-ignore no-explicit-any
  public callGetIndexer(ctx: any, schema: any): string {
    return this.render('getIndexer', ctx, schema);
  }

  // deno-lint-ignore no-explicit-any
  public callGetType(ctx: any, schema: any, options?: any): string {
    return this.render('getType', ctx, schema, options);
  }

  // deno-lint-ignore no-explicit-any
  public callGetProperties(ctx: any, schema: any): string {
    const builder = new TypeScriptFileBuilder();
    // deno-lint-ignore no-explicit-any
    builder.append(ts.objectType({ members: (this as any).getProperties(ctx, schema) }));
    return builder.toString(false);
  }
}

// A minimal stand-in for a primitive (non-composed, non-declared) branch schema. `isNameGenerated: true` together
// with a primitive `kind` makes `shouldGenerateTypeDeclaration` return false, so `getType` inlines the primitive
// instead of emitting a `ts.reference`.
function primitiveSchema(kind: 'string' | 'number' | 'boolean', nullable = false): ApiSchema {
  return {
    id: `schema-${kind}${nullable ? '-nullable' : ''}`,
    kind,
    type: kind,
    isNameGenerated: true,
    enum: undefined,
    format: undefined,
    nullable,
    $ref: undefined,
  } as unknown as ApiSchema;
}

/**
 * The schema `type: 'null'` transforms to: `transformSchema` reports the null type as `nullable`, so this stands
 * in for a branch that already renders as `null` on its own and must not have a second `null` added.
 */
function nullSchema(): ApiSchema {
  return {
    id: 'schema-null',
    kind: 'null',
    type: 'null',
    isNameGenerated: true,
    enum: undefined,
    nullable: true,
    $ref: undefined,
  } as unknown as ApiSchema;
}

describe('DefaultTypeScriptModelGenerator', () => {
  describe('getCombinedType', () => {
    const generator = () => new TestableGenerator();
    // deno-lint-ignore no-explicit-any
    const ctx: any = { schema: { id: 'parent-schema' }, config: {} };

    it('renders anyOf as a union of its branches instead of a Partial<> intersection', () => {
      const schema = {
        id: 'combined-schema',
        allOf: [],
        anyOf: [primitiveSchema('string'), primitiveSchema('number')],
      } as unknown as CombinedLikeApiSchema;

      const result = generator().callGetCombinedType(ctx, schema);

      expect(result).not.toContain('Partial<');
      expect(result).toContain('|');
      expect(result).toBe('(string) | (number)');
    });

    it('intersects allOf branches with the union of anyOf branches when both are present', () => {
      const schema = {
        id: 'combined-schema',
        allOf: [primitiveSchema('boolean')],
        anyOf: [primitiveSchema('string'), primitiveSchema('number')],
      } as unknown as CombinedLikeApiSchema;

      const result = generator().callGetCombinedType(ctx, schema);

      expect(result).not.toContain('Partial<');
      expect(result).toBe('(boolean) & ((string) | (number))');
    });

    it('renders a lone allOf branch as a plain intersection, unaffected by the anyOf fix', () => {
      const schema = {
        id: 'combined-schema',
        allOf: [primitiveSchema('boolean'), primitiveSchema('string')],
        anyOf: [],
      } as unknown as CombinedLikeApiSchema;

      const result = generator().callGetCombinedType(ctx, schema);

      expect(result).toBe('(boolean) & (string)');
    });
  });

  // A schema's `nullable` used to be honoured at exactly one site: the property renderer. Every other place a
  // schema is rendered as a *member* of an enclosing type - a composition branch, an array element, an
  // `additionalProperties` value - dropped the `null`, and nothing downstream added it back, so the emitted type
  // could not represent a value the spec explicitly permits.
  describe('nullability of member positions', () => {
    const generator = () => new TestableGenerator();
    // deno-lint-ignore no-explicit-any
    const ctx: any = { schema: { id: 'parent-schema' }, config: {} };

    it('admits null in an anyOf branch whose schema is nullable', () => {
      const schema = {
        id: 'combined-schema',
        allOf: [],
        anyOf: [primitiveSchema('string'), primitiveSchema('number', true)],
      } as unknown as CombinedLikeApiSchema;

      expect(generator().callGetCombinedType(ctx, schema)).toBe('(string) | (number) | (null)');
    });

    it('admits null in an allOf branch whose schema is nullable', () => {
      const schema = {
        id: 'combined-schema',
        allOf: [primitiveSchema('string', true)],
        anyOf: [],
      } as unknown as CombinedLikeApiSchema;

      expect(generator().callGetCombinedType(ctx, schema)).toBe('(string) | (null)');
    });

    it('admits null in a oneOf branch whose schema is nullable', () => {
      const schema = {
        id: 'one-of-schema',
        oneOf: [primitiveSchema('string'), primitiveSchema('number', true)],
      } as unknown as ApiSchema<'oneOf'>;

      expect(generator().callGetOneOfType(ctx, schema)).toBe('(string) | (number) | (null)');
    });

    it('does not add a second null to a oneOf branch that is itself the null type', () => {
      const schema = {
        id: 'one-of-schema',
        oneOf: [primitiveSchema('string'), nullSchema()],
      } as unknown as ApiSchema<'oneOf'>;

      expect(generator().callGetOneOfType(ctx, schema)).toBe('(string) | (null)');
    });

    it('admits null in the element type of an array with nullable items', () => {
      const schema = {
        id: 'array-schema',
        kind: 'array',
        type: 'array',
        items: primitiveSchema('string', true),
      } as unknown as ApiSchema<'array'>;

      expect(generator().callGetArrayType(ctx, schema)).toBe('((string) | (null))[]');
    });

    it('admits null in the value type of a nullable additionalProperties schema', () => {
      const schema = {
        id: 'object-schema',
        kind: 'object',
        type: 'object',
        properties: new Map(),
        required: new Set<string>(),
        additionalProperties: primitiveSchema('string', true),
      } as unknown as ApiSchema<'object'>;

      expect(generator().callGetIndexer(ctx, schema)).toContain('[key: string]: (string) | (null);');
    });

    it('adds exactly one null to a property whose own schema is nullable', () => {
      const property = { name: 'value', schema: primitiveSchema('string', true) };
      const schema = {
        id: 'object-schema',
        kind: 'object',
        type: 'object',
        properties: new Map([[property.name, property]]),
        required: new Set<string>(),
        additionalProperties: undefined,
      } as unknown as ApiSchema<'object'>;

      const result = generator().callGetProperties(ctx, schema);

      expect(result).toContain('value?: (string) | (null);');
      expect(result).not.toContain('(null) | (null)');
    });

    // The boundary: `getType` renders a schema's own type without its nullability, because the two contexts that
    // declare a schema's type as a whole - a property (whose renderer adds the `null`) and a top-level type alias
    // (whose `null` is deliberately not hoisted) - would otherwise get it twice or gain it unasked.
    it('leaves the type of a nullable schema itself untouched', () => {
      expect(generator().callGetType(ctx, primitiveSchema('string', true))).toBe('string');
    });
  });
});
