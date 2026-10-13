import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsVariable } from './variable.ts';

describe('tsVariable', () => {
  let builder: TypeScriptFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new TypeScriptFileBuilder(
      undefined,
      { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
    );
  });

  it('should write the name of the variable', () => {
    builder.append(tsVariable('x'));
    expect(builder.toString(false)).toBe('let x;\n');
  });

  it('should write the type if it exists', () => {
    builder.append(tsVariable('x', { type: 'number' }));
    expect(builder.toString(false)).toBe('let x: number;\n');
  });

  it('should write the value if it exists', () => {
    builder.append(tsVariable('x', { value: 42 }));
    expect(builder.toString(false)).toBe('let x = 42;\n');
  });

  it('should write the const keyword if configured', () => {
    builder.append(tsVariable('x', { readonly: true }));
    expect(builder.toString(false)).toBe('const x;\n');
  });

  it('should write the export keyword if configured', () => {
    builder.append(tsVariable('x', { export: true }));
    expect(builder.toString(false)).toBe('export let x;\n');
  });

  it('should write all the parts of the variable', () => {
    builder.append(tsVariable('x', { type: 'number', value: 42, readonly: true, export: true }));
    expect(builder.toString(false)).toBe('export const x: number = 42;\n');
  });

  it('should render injections', () => {
    builder.append(tsVariable('x', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe('beforelet x;\nafter');
  });
});
