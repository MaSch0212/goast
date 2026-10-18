import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csGenericParameter } from './generic-parameter.ts';
import { csReference } from './reference.ts';

describe('csGenericParameter', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write the name only', () => {
    builder.append(csGenericParameter('T', { constraints: ['class'] }));
    expect(builder.toString(false)).toBe('T');
  });

  it('should write variance', () => {
    builder.append(csGenericParameter('T', { variance: 'out' }));
    expect(builder.toString(false)).toBe('out T');
  });

  it('should render injections', () => {
    builder.append(csGenericParameter('T', { inject: { beforeName: '<', afterName: '>' } }));
    expect(builder.toString(false)).toBe('<T>');
  });

  describe('write', () => {
    it('should write nothing without parameters', () => {
      csGenericParameter.write(builder, []);
      expect(builder.toString(false)).toBe('');
    });

    it('should write parameters in angle brackets', () => {
      csGenericParameter.write(builder, [csGenericParameter('T'), csGenericParameter('U')]);
      expect(builder.toString(false)).toBe('<T, U>');
    });
  });

  describe('writeConstraints', () => {
    it('should write nothing without constraints', () => {
      csGenericParameter.writeConstraints(builder, [csGenericParameter('T')]);
      expect(builder.toString(false)).toBe('');
    });

    it('should write a single clause on the same line', () => {
      csGenericParameter.writeConstraints(builder, [
        csGenericParameter('T', { constraints: ['class', csReference('IDisposable', 'System'), 'new()'] }),
        csGenericParameter('U'),
      ]);
      expect(builder.toString(false)).toBe(' where T : class, IDisposable, new()');
      expect(builder.usings.usings).toEqual(['System']);
    });

    it('should write multiple clauses on separate indented lines', () => {
      csGenericParameter.writeConstraints(builder, [
        csGenericParameter('T', { constraints: ['class'] }),
        csGenericParameter('U', { constraints: ['struct'] }),
      ]);
      expect(builder.toString(false)).toBe('\n    where T : class\n    where U : struct');
    });
  });
});
