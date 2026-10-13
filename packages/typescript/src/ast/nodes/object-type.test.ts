import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsMethod } from './method.ts';
import { tsObjectType } from './object-type.ts';
import { tsProperty } from './property.ts';

describe('tsObjectType', () => {
  let builder: TypeScriptFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new TypeScriptFileBuilder(
      undefined,
      { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
    );
  });

  it('should write the properties if they exist', () => {
    builder.append(tsObjectType({ members: [tsProperty('x'), tsProperty('y')] }));
    expect(builder.toString(false)).toBe('{\n  x;\n  y;\n}');
  });

  it('should write the methods if they exist', () => {
    builder.append(tsObjectType({ members: [tsMethod('x'), tsMethod('y')] }));
    expect(builder.toString(false)).toBe('{\n  x();\n  y();\n}');
  });

  it('should write all the parts of the object type', () => {
    builder.append(
      tsObjectType({
        members: [tsProperty('x'), tsProperty('y'), tsMethod('x'), tsMethod('y')],
      }),
    );
    expect(builder.toString(false)).toBe('{\n  x;\n  y;\n  x();\n  y();\n}');
  });

  it('should render injections', () => {
    builder.append(tsObjectType({ inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe('before{}after');
  });
});
