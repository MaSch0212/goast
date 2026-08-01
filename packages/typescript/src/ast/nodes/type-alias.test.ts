import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsGenericParameter } from './generic-parameter.ts';
import { tsTypeAlias } from './type-alias.ts';

describe('tsTypeAlias', () => {
  let builder: TypeScriptFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new TypeScriptFileBuilder(
      undefined,
      { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
    );
  });

  it('should write the name of the type alias', () => {
    builder.append(tsTypeAlias('X', 'number'));
    expect(builder.toString(false)).toBe('type X = number;\n');
  });

  it('should write the generics if they exist', () => {
    builder.append(tsTypeAlias('X', 'number', { generics: [tsGenericParameter('T'), tsGenericParameter('U')] }));
    expect(builder.toString(false)).toBe('type X<T, U> = number;\n');
  });

  it('should write export keyword if configured', () => {
    builder.append(tsTypeAlias('X', 'number', { export: true }));
    expect(builder.toString(false)).toBe('export type X = number;\n');
  });

  it('should render injections', () => {
    builder.append(tsTypeAlias('X', 'number', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe('beforetype X = number;\nafter');
  });
});
