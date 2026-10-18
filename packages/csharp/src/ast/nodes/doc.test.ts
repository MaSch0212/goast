import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csDocTag } from './doc-tag.ts';
import { csDoc } from './doc.ts';
import { csGenericParameter } from './generic-parameter.ts';
import { csParameter } from './parameter.ts';

describe('csDoc', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should not write anything if the node is empty', () => {
    builder.append(csDoc(null));
    expect(builder.toString(false)).toBe('');
  });

  it('should write the summary', () => {
    builder.append(csDoc('description'));
    expect(builder.toString(false)).toBe('/// <summary>\n/// description\n/// </summary>\n');
  });

  it('should write tags', () => {
    builder.append(csDoc(null, [csDocTag.param('id', 'The id'), csDocTag.returns('The pet')]));
    expect(builder.toString(false)).toBe('/// <param name="id">The id</param>\n/// <returns>The pet</returns>\n');
  });

  it('should write all the parts of the node', () => {
    builder.append(csDoc('description', [csDocTag.param('id', 'The id'), csDocTag.returns('The pet')]));
    expect(builder.toString(false)).toBe(
      '/// <summary>\n/// description\n/// </summary>\n/// <param name="id">The id</param>\n/// <returns>The pet</returns>\n',
    );
  });

  it('should prefix every line of a multi-line summary', () => {
    builder.append(csDoc('line 1\nline 2\n\nline 4'));
    expect(builder.toString(false)).toBe('/// <summary>\n/// line 1\n/// line 2\n///\n/// line 4\n/// </summary>\n');
  });

  it('should escape XML characters', () => {
    builder.append(csDoc('Uses List<T> & more'));
    expect(builder.toString(false)).toBe('/// <summary>\n/// Uses List&lt;T&gt; &amp; more\n/// </summary>\n');
  });

  it('should start on a new line', () => {
    builder.append('public class Foo { }', csDoc('x'));
    expect(builder.toString(false)).toBe('public class Foo { }\n/// <summary>\n/// x\n/// </summary>\n');
  });

  it('should render injections', () => {
    builder.append(csDoc('hello', [], { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe('before\n/// <summary>\n/// hello\n/// </summary>\nafter');
  });

  describe('get', () => {
    it('should return null if there is nothing to document', () => {
      expect(
        csDoc.get(null, { parameters: [csParameter('a', 'int')], generics: [csGenericParameter('T')] }),
      ).toBeNull();
    });

    it('should return the base doc content if there is nothing to add', () => {
      const doc = csDoc.get(csDoc('base'), { parameters: [csParameter('a', 'int')] });
      builder.append(doc);
      expect(builder.toString(false)).toBe('/// <summary>\n/// base\n/// </summary>\n');
    });

    it('should add typeparam and param tags before the other tags', () => {
      const base = csDoc('base', [csDocTag.returns('result')]);
      const doc = csDoc.get(base, {
        parameters: [csParameter('a', 'int', { description: 'The a' }), csParameter('b', 'int')],
        generics: [csGenericParameter('T', { description: 'The T' })],
      });
      builder.append(doc);
      expect(builder.toString(false)).toBe(
        [
          '/// <summary>',
          '/// base',
          '/// </summary>',
          '/// <typeparam name="T">The T</typeparam>',
          '/// <param name="a">The a</param>',
          '/// <returns>result</returns>',
          '',
        ].join('\n'),
      );
    });

    it('should not modify the base doc', () => {
      const base = csDoc('base');
      csDoc.get(base, { parameters: [csParameter('a', 'int', { description: 'The a' })] });
      expect(base.tags).toEqual([]);
    });

    it('should create a doc without a summary if there is no base doc', () => {
      const doc = csDoc.get(null, { parameters: [csParameter('a', 'int', { description: 'The a' })] });
      builder.append(doc);
      expect(builder.toString(false)).toBe('/// <param name="a">The a</param>\n');
    });
  });
});
