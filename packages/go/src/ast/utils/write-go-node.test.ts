import { SourceBuilder } from '@goast/core';
import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import * as refs from '../references/index.ts';
import { goReference } from '../nodes/reference.ts';
import { goSlice } from '../nodes/slice.ts';
import { goString } from '../nodes/string.ts';
import { renderGoNode, writeGoNode, writeGoNodes } from './write-go-node.ts';

const options = {
  ...defaultGoGeneratorConfig,
  newLine: '\n',
  addGeneratedHeader: false,
} as GoGeneratorConfig;

function createBuilder(): GoFileBuilder {
  return new GoFileBuilder('api', undefined, options);
}

describe('writeGoNode', () => {
  it('writes a node by letting it write itself', () => {
    const builder = createBuilder();
    writeGoNode(builder, goString('a'));

    expect(builder.toFragmentString()).toBe('"a"');
  });

  it('appends a plain value as it is', () => {
    const builder = createBuilder();
    writeGoNode(builder, 'raw text');

    expect(builder.toFragmentString()).toBe('raw text');
  });

  it('writes nothing for a nullish value', () => {
    const builder = createBuilder();
    writeGoNode(builder, null);
    writeGoNode(builder, undefined);

    expect(builder.toFragmentString()).toBe('');
  });

  it('adds the imports of a node to the file', () => {
    const builder = createBuilder();
    writeGoNode(builder, goReference('Pet', 'example.com/pets'));

    expect(builder.toString()).toBe('package api\n\nimport "example.com/pets"\n\npets.Pet\n');
  });
});

describe('writeGoNodes', () => {
  it('writes a single value that is not a list', () => {
    const builder = createBuilder();
    writeGoNodes(builder, goString('a'));

    expect(builder.toFragmentString()).toBe('"a"');
  });

  it('writes the nodes one after another without a separator', () => {
    const builder = createBuilder();
    writeGoNodes(builder, [goString('a'), goString('b')]);

    expect(builder.toFragmentString()).toBe('"a""b"');
  });

  it('writes the separator between the nodes', () => {
    const builder = createBuilder();
    writeGoNodes(builder, [goString('a'), goString('b'), goString('c')], { separator: ', ' });

    expect(builder.toFragmentString()).toBe('"a", "b", "c"');
  });

  it('skips nullish entries without writing a separator for them', () => {
    const builder = createBuilder();
    writeGoNodes(builder, [goString('a'), null, undefined, goString('b')], { separator: ', ' });

    expect(builder.toFragmentString()).toBe('"a", "b"');
  });

  it('writes nothing for an empty list or a list of nullish entries', () => {
    const builder = createBuilder();
    writeGoNodes(builder, []);
    writeGoNodes(builder, [null, undefined], { separator: ', ' });

    expect(builder.toFragmentString()).toBe('');
  });

  it('writes a single entry of a list without a separator', () => {
    const builder = createBuilder();
    writeGoNodes(builder, [null, goString('a')], { separator: ', ' });

    expect(builder.toFragmentString()).toBe('"a"');
  });

  it('writes plain values between the nodes', () => {
    const builder = createBuilder();
    writeGoNodes(builder, ['a', goString('b')], { separator: '|' });

    expect(builder.toFragmentString()).toBe('a|"b"');
  });
});

describe('renderGoNode', () => {
  it('renders a node to its text', () => {
    const builder = createBuilder();

    expect(renderGoNode(builder, goSlice(goReference('Pet')))).toBe('[]Pet');
  });

  it('renders nothing for a nullish value', () => {
    expect(renderGoNode(createBuilder(), null)).toBe('');
    expect(renderGoNode(createBuilder(), undefined)).toBe('');
  });

  it('renders a plain value as it is', () => {
    expect(renderGoNode(createBuilder(), 'raw')).toBe('raw');
  });

  it('leaves out what the file builder has already written', () => {
    const builder = createBuilder();
    builder.append('existing');

    expect(renderGoNode(builder, goString('a'))).toBe('"a"');
    expect(builder.toFragmentString()).toBe('existing');
  });

  it('adds the imports of the node to the file builder', () => {
    const builder = createBuilder();

    expect(renderGoNode(builder, goReference('Pet', 'example.com/pets'))).toBe('pets.Pet');
    expect(builder.toString()).toBe('package api\n\nimport "example.com/pets"\n');
  });

  it('renders with a plain builder without adding anything to it', () => {
    const builder = new SourceBuilder(options);

    expect(renderGoNode(builder, goSlice(refs.string()))).toBe('[]string');
    expect(builder.toString()).toBe('');
  });
});
