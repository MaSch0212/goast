import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { csArgument } from './argument.ts';
import { csCall } from './call.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csReference } from './reference.ts';
import { csString } from './string.ts';

describe('csCall', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write a call without arguments', () => {
    builder.append(csCall('Foo', []));
    expect(builder.toString(false)).toBe('Foo()');
  });

  it('should write member access when arguments are omitted', () => {
    builder.append(csCall(['items', 'Length']));
    expect(builder.toString(false)).toBe('items.Length');
  });

  it('should write a call with a path and arguments', () => {
    builder.append(csCall(['console', 'WriteLine'], [csString('hi'), '1']));
    expect(builder.toString(false)).toBe('console.WriteLine("hi", 1)');
  });

  it('should write named arguments', () => {
    builder.append(csCall('Foo', [csArgument.named('a', '1')]));
    expect(builder.toString(false)).toBe('Foo(a: 1)');
  });

  it('should write a reference as the call target and register its using', () => {
    builder.append(csCall([csReference('Guid', 'System'), 'NewGuid'], []));
    expect(builder.toString(false)).toBe('Guid.NewGuid()');
    expect(builder.usings.usings).toEqual(['System']);
  });

  it('should write generic arguments after the last path part', () => {
    builder.append(csCall(['JsonSerializer', 'Deserialize'], ['json'], { generics: [csReference('Pet')] }));
    expect(builder.toString(false)).toBe('JsonSerializer.Deserialize<Pet>(json)');
  });

  it('should write await', () => {
    builder.append(csCall(['client', 'SendAsync'], ['request'], { await: true }));
    expect(builder.toString(false)).toBe('await client.SendAsync(request)');
  });

  it('should write a call as part of the path', () => {
    builder.append(csCall([csCall('GetClient', []), 'Dispose'], []));
    expect(builder.toString(false)).toBe('GetClient().Dispose()');
  });

  it('should write more than three arguments on separate lines', () => {
    builder.append(csCall('Foo', ['1', '2', '3', '4']));
    expect(builder.toString(false)).toBe('Foo(\n    1,\n    2,\n    3,\n    4\n)');
  });
});
