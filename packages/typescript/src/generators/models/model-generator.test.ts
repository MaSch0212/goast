import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { ApiSchema, CombinedLikeApiSchema } from '@goast/core';

import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { DefaultTypeScriptModelGenerator } from './model-generator.ts';

class TestableGenerator extends DefaultTypeScriptModelGenerator {
  // deno-lint-ignore no-explicit-any
  public callGetCombinedType(ctx: any, schema: any): string {
    const builder = new TypeScriptFileBuilder();
    // deno-lint-ignore no-explicit-any
    builder.append((this as any).getCombinedType(ctx, schema));
    return builder.toString(false);
  }
}

// A minimal stand-in for a primitive (non-composed, non-declared) branch schema. `isNameGenerated: true` together
// with a primitive `kind` makes `shouldGenerateTypeDeclaration` return false, so `getType` inlines the primitive
// instead of emitting a `ts.reference`.
function primitiveSchema(kind: 'string' | 'number' | 'boolean'): ApiSchema {
  return {
    id: `schema-${kind}`,
    kind,
    type: kind,
    isNameGenerated: true,
    enum: undefined,
    format: undefined,
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
});
