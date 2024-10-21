import { ktArgument } from './argument.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

describe('ktArgument', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should write argument', () => {
    builder.append(ktArgument('123'));
    expect(builder.toString(false)).toBe('123');
  });

  it('should write argument with name', () => {
    builder.append(ktArgument('123', { name: 'y' }));
    expect(builder.toString(false)).toBe('y = 123');
  });

  it('should render injections', () => {
    builder.append(
      ktArgument('123', {
        name: 'y',
        inject: {
          before: '║b║',
          after: '║a║',
          beforeName: '║bn║',
          afterName: '║an║',
          beforeValue: '║bv║',
          afterValue: '║av║',
        },
      }),
    );
    expect(builder.toString(false)).toBe('║b║║bn║y║an║ = ║bv║123║av║║a║');
  });
});
