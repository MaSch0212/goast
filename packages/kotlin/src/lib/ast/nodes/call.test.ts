import { ktCall } from './call.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

describe('ktCall', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should write call with single path', () => {
    builder.append(ktCall(['foo']));
    expect(builder.toString(false)).toBe('foo');
  });

  it('should write call with multiple path', () => {
    builder.append(ktCall(['foo', 'bar']));
    expect(builder.toString(false)).toBe('foo.bar');
  });

  it('should write call with no arguments', () => {
    builder.append(ktCall(['foo'], []));
    expect(builder.toString(false)).toBe('foo()');
  });

  it('should write call with single argument', () => {
    builder.append(ktCall(['foo'], ['bar']));
    expect(builder.toString(false)).toBe('foo(bar)');
  });

  it('should write call with multiple arguments', () => {
    builder.append(ktCall(['foo'], ['bar', 'baz']));
    expect(builder.toString(false)).toBe('foo(bar, baz)');
  });

  it('should render injections', () => {
    builder.append(ktCall(['foo'], null, { inject: { before: '║b║', after: '║a║' } }));
    expect(builder.toString(false)).toBe('║b║foo║a║');
  });
});
