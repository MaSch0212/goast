import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsMethod } from './method.ts';
import { tsObject } from './object.ts';
import { tsProperty } from './property.ts';

describe('tsObject', () => {
  let builder: TypeScriptFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new TypeScriptFileBuilder(
      undefined,
      { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
    );
  });

  it('should write the properties if they exist', () => {
    builder.append(tsObject({ members: [tsProperty('x'), tsProperty('y')] }));
    expect(builder.toString(false)).toBe('{\n  x,\n  y,\n}');
  });

  it('should write the methods if they exist', () => {
    builder.append(tsObject({ members: [tsMethod('x'), tsMethod('y')] }));
    expect(builder.toString(false)).toBe('{\n  x(),\n  y(),\n}');
  });

  it('should write all the parts of the object', () => {
    builder.append(
      tsObject({
        members: [tsProperty('x'), tsProperty('y'), tsMethod('x'), tsMethod('y')],
      }),
    );
    expect(builder.toString(false)).toBe('{\n  x,\n  y,\n  x(),\n  y(),\n}');
  });

  it('should render injections', () => {
    builder.append(tsObject({ inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe('before{}after');
  });
});
