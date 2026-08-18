import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../config.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktDocTag } from './doc-tag.ts';
import { ktDoc } from './doc.ts';

describe('ktDoc', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new KotlinFileBuilder(
      undefined,
      { ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig,
    );
  });

  it('should not write anything if the node is empty', () => {
    builder.append(ktDoc(null));
    expect(builder.toString(false)).toBe('');
  });

  it('should write description', () => {
    builder.append(ktDoc('description'));
    expect(builder.toString(false)).toBe('/**\n * description\n */\n');
  });

  it('should write tags', () => {
    builder.append(ktDoc(null, [ktDocTag('tag1'), ktDocTag('tag2')]));
    expect(builder.toString(false)).toBe('/**\n * @tag1\n * @tag2\n */\n');
  });

  it('should write all the parts of the node', () => {
    builder.append(ktDoc('description', [ktDocTag('tag1'), ktDocTag('tag2')]));
    expect(builder.toString(false)).toBe('/**\n * description\n *\n * @tag1\n * @tag2\n */\n');
  });

  it('should render injections', () => {
    builder.append(ktDoc('hello', [], { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe('before\n/**\n * hello\n */\nafter');
  });
});
