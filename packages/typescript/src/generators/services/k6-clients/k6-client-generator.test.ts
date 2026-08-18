import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { defaultTypeScriptGeneratorConfig } from '../../../config.ts';
import { TypeScriptFileBuilder } from '../../../file-builder.ts';
import { DefaultTypeScriptK6ClientGenerator } from './k6-client-generator.ts';

class TestableGenerator extends DefaultTypeScriptK6ClientGenerator {
  // deno-lint-ignore no-explicit-any
  public callGetEndpointParamsType(ctx: any, endpoint: any): string {
    const builder = new TypeScriptFileBuilder();
    // deno-lint-ignore no-explicit-any
    builder.append((this as any).getEndpointParamsType(ctx, endpoint));
    return builder.toString(false);
  }
}

// A deprecated query parameter with no description of its own, alongside a deprecated parameter that does have
// a description and a plain (non-deprecated) parameter, mirroring the `deprecatedParams` operation in
// `test/specs/v3/defaults-and-deprecated.yml`.
function param(name: string, options: { deprecated?: boolean; description?: string }) {
  return {
    name,
    schema: undefined,
    deprecated: options.deprecated ?? false,
    description: options.description,
    required: false,
    target: 'query',
  };
}

describe('DefaultTypeScriptK6ClientGenerator', () => {
  describe('getEndpointParamsType', () => {
    const generator = () => new TestableGenerator();
    // deno-lint-ignore no-explicit-any
    const ctx: any = {
      config: { ...defaultTypeScriptGeneratorConfig, language: 'javascript' },
      input: { typescript: { models: {} } },
    };

    it('does not render a dangling "Deprecated:" for a deprecated parameter with no description', () => {
      const endpoint = {
        name: 'deprecatedParams',
        parameters: [param('noDesc', { deprecated: true })],
        requestBody: undefined,
      };

      const result = generator().callGetEndpointParamsType(ctx, endpoint);

      expect(result).not.toContain('Deprecated:');
    });

    it('keeps the description for a deprecated parameter that has one', () => {
      const endpoint = {
        name: 'deprecatedParams',
        parameters: [param('withDesc', { deprecated: true, description: 'This parameter is deprecated.' })],
        requestBody: undefined,
      };

      const result = generator().callGetEndpointParamsType(ctx, endpoint);

      expect(result).toContain('Deprecated: This parameter is deprecated.');
    });

    it('renders no description at all for a plain, non-deprecated parameter', () => {
      const endpoint = {
        name: 'deprecatedParams',
        parameters: [param('plain', {})],
        requestBody: undefined,
      };

      const result = generator().callGetEndpointParamsType(ctx, endpoint);

      expect(result).toMatch(/@property \{unknown\} \[plain\]\s*\n/);
      expect(result).not.toContain('@property {unknown} [plain] Deprecated');
    });
  });
});
