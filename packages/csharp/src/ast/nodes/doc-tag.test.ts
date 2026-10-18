import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csDocTag, escapeXmlDoc } from './doc-tag.ts';

describe('csDocTag', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write a self-closing tag without text', () => {
    builder.append(csDocTag('inheritdoc'));
    expect(builder.toString(false)).toBe('<inheritdoc />');
  });

  it('should write a tag with text on a single line', () => {
    builder.append(csDocTag.returns('The pet'));
    expect(builder.toString(false)).toBe('<returns>The pet</returns>');
  });

  it('should write a param tag with its name attribute', () => {
    builder.append(csDocTag.param('id', 'The id'));
    expect(builder.toString(false)).toBe('<param name="id">The id</param>');
  });

  it('should write a typeparam tag', () => {
    builder.append(csDocTag.typeparam('T', 'The item type'));
    expect(builder.toString(false)).toBe('<typeparam name="T">The item type</typeparam>');
  });

  it('should write an exception tag with its cref attribute', () => {
    builder.append(csDocTag.exception('ArgumentException', 'If invalid'));
    expect(builder.toString(false)).toBe('<exception cref="ArgumentException">If invalid</exception>');
  });

  it('should write summary and remarks as blocks', () => {
    builder.append(csDocTag.summary('Text'));
    expect(builder.toString(false)).toBe('<summary>\nText\n</summary>');
  });

  it('should write multi-line text as a block', () => {
    builder.append(csDocTag.returns('Line 1\nLine 2'));
    expect(builder.toString(false)).toBe('<returns>\nLine 1\nLine 2\n</returns>');
  });

  it('should escape XML characters in text', () => {
    builder.append(csDocTag.returns('a < b && c > d'));
    expect(builder.toString(false)).toBe('<returns>a &lt; b &amp;&amp; c &gt; d</returns>');
  });

  it('should not escape raw text', () => {
    builder.append(csDocTag.returns('See <see cref="Foo"/>', { raw: true }));
    expect(builder.toString(false)).toBe('<returns>See <see cref="Foo"/></returns>');
  });

  it('should escape attribute values', () => {
    builder.append(csDocTag('param', 'x', { attributes: { name: 'a"<b' } }));
    expect(builder.toString(false)).toBe('<param name="a&quot;&lt;b">x</param>');
  });

  it('should render injections', () => {
    builder.append(csDocTag('b', 'x', { inject: { before: '[', after: ']' } }));
    expect(builder.toString(false)).toBe('[<b>x</b>]');
  });

  describe('write', () => {
    it('should write tags on separate lines', () => {
      csDocTag.write(builder, [csDocTag.param('a', 'A'), csDocTag.param('b', 'B')]);
      expect(builder.toString(false)).toBe('<param name="a">A</param>\n<param name="b">B</param>');
    });
  });
});

describe('escapeXmlDoc', () => {
  it('should escape ampersands, less-than and greater-than signs', () => {
    expect(escapeXmlDoc('a & b < c > d')).toBe('a &amp; b &lt; c &gt; d');
  });

  it('should escape ampersands only once', () => {
    expect(escapeXmlDoc('<')).toBe('&lt;');
  });
});
