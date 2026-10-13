import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { dedent } from '@goast/test-harness';

import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../config.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktCollectionLiteral } from './collection-literal.ts';

describe('ktCollectionLiteral', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new KotlinFileBuilder(
      undefined,
      { ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig,
    );
  });

  it('writes an empty literal for no elements', () => {
    builder.append(ktCollectionLiteral([]));
    expect(builder.toString(false)).toBe('[]');
  });

  it('writes up to two elements on one line', () => {
    builder.append(ktCollectionLiteral(['1', '2']));
    expect(builder.toString(false)).toBe('[1, 2]');
  });

  it('breaks to multiple lines at three elements', () => {
    builder.append(ktCollectionLiteral(['1', '2', '3']));
    expect(builder.toString(false)).toBe(
      dedent(6)(
        `[
          1,
          2,
          3
      ]`,
      ),
    );
  });

  it('drops nullish elements before counting, so three entries with a null stay on one line', () => {
    builder.append(ktCollectionLiteral(['1', null, '2']));
    expect(builder.toString(false)).toBe('[1, 2]');
  });

  it('treats a nullish element list as empty', () => {
    builder.append(ktCollectionLiteral(null));
    expect(builder.toString(false)).toBe('[]');
  });
});
