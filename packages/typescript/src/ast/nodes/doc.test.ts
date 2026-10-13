import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsDocTag } from './doc-tag.ts';
import { tsDoc } from './doc.ts';

describe('tsDoc', () => {
  let builder: TypeScriptFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new TypeScriptFileBuilder(
      undefined,
      { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
    );
  });

  it('should not write anything if the node is empty', () => {
    builder.append(tsDoc());
    expect(builder.toString(false)).toBe('');
  });

  it('should write description', () => {
    builder.append(tsDoc({ description: 'description' }));
    expect(builder.toString(false)).toBe('/**\n * description\n */\n');
  });

  it('should write tags', () => {
    builder.append(tsDoc({ tags: [tsDocTag('tag1'), tsDocTag('tag2')] }));
    expect(builder.toString(false)).toBe('/**\n * @tag1\n * @tag2\n */\n');
  });

  it('should write all the parts of the node', () => {
    builder.append(tsDoc({ description: 'description', tags: [tsDocTag('tag1'), tsDocTag('tag2')] }));
    expect(builder.toString(false)).toBe('/**\n * description\n *\n * @tag1\n * @tag2\n */\n');
  });

  it('should render injections', () => {
    builder.append(tsDoc({ description: 'hello', inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe('before\n/**\n * hello\n */\nafter');
  });
});
