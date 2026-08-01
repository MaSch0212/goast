import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import {
  builderTemplate,
  defaultSourceBuilderOptions,
  SourceBuilder,
  type SourceBuilderOptions,
} from './source-builder.ts';
import { appendValueGroup } from './string-builder/utils.ts';

describe('SourceBuilder', () => {
  let sb: SourceBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent; the constructor's actual
    // default is verified separately.
    sb = new SourceBuilder({ newLine: '\n' });
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const options = new SourceBuilder().options;
      expect(options.indent).toEqual({ type: 'spaces', count: 2 });
      expect(options.newLine).toBe(defaultSourceBuilderOptions.newLine);
    });
  });

  describe('fromString', () => {
    it('should create a new instance of SourceBuilder with the given string', () => {
      const str = 'test string';
      const sb = SourceBuilder.fromString(str);
      expect(sb.toString()).toEqual(str);
    });

    it('should create a new instance of SourceBuilder with the given string and options', () => {
      const str = 'test string';
      const options: Partial<SourceBuilderOptions> = {
        indent: { type: 'tabs' },
        newLine: '\n-',
      };
      const sb = SourceBuilder.fromString(str, options);
      expect(sb.toString()).toEqual(str);
      expect(sb.options).toEqual(expect.objectContaining(options));
    });
  });

  describe('build', () => {
    it('should build a string using a callback function that receives a `SourceBuilder` instance', () => {
      const buildAction = (builder: SourceBuilder) => {
        builder.append('hello');
        builder.append('world');
      };
      const result = SourceBuilder.build(buildAction);
      expect(result).toEqual('helloworld');
    });

    it('should build a string using a callback function that receives a `SourceBuilder` instance and options', () => {
      const buildAction = (builder: SourceBuilder) => {
        builder.appendLine('hello');
        builder.indent((b) => b.append('world'));
      };
      const options: Partial<SourceBuilderOptions> = {
        indent: { type: 'spaces', count: 4 },
        newLine: '\r\n\t',
      };
      const result = SourceBuilder.build(buildAction, options);
      expect(result).toEqual(`hello${options.newLine}    world`);
    });
  });

  describe('append', () => {
    it('should handle consecutive line breaks', () => {
      sb.append('line1', '\n', '\n', '\n', 'line2');
      expect(sb.toString()).toBe('line1\n\n\nline2');
    });

    it('should handle mixed line breaks', () => {
      sb.append('line1\r\n', '\n', 'line2\r', '\r', 'line3\n', 'line4');
      expect(sb.toString()).toBe('line1\n\nline2line3\nline4');
    });

    it('should handle strings with special chars', () => {
      sb.append('line1 {', '\n', 'line2}');
      expect(sb.toString()).toBe('line1 {\nline2}');
    });

    it('should handle long strings without line breaks', () => {
      sb.append('This is a long string without any line breaks.');
      expect(sb.toString()).toBe('This is a long string without any line breaks.');
    });

    it('should handle multiple calls', () => {
      sb.append('line1', '\n');
      sb.append('line2', '\n');
      sb.append('line3', '\n');
      expect(sb.toString()).toBe('line1\nline2\nline3\n');
    });

    it('should handle empty input', () => {
      sb.append('', '', '', '\n', '', '');
      expect(sb.toString()).toBe('\n');
    });

    it('should apply the provided builder function to the source builder', () => {
      const builder = new SourceBuilder().append((b) => b.append('foo'));
      expect(builder.toString()).toBe('foo');
    });
  });

  describe('appendIf', () => {
    it('should append the string when condition is true', () => {
      sb.appendIf(true, 'line1', '\n');
      expect(sb.toString()).toBe('line1\n');
    });

    it('should not append the string when condition is false', () => {
      sb.appendIf(false, 'line1', '\n');
      expect(sb.toString()).toBe('');
    });

    it('should append the string when condition is a function returning true', () => {
      sb.appendIf(() => true, 'line1', '\n');
      expect(sb.toString()).toBe('line1\n');
    });

    it('should not append the string when condition is a function returning false', () => {
      sb.appendIf(() => false, 'line1', '\n');
      expect(sb.toString()).toBe('');
    });
  });

  describe('appendLineIf', () => {
    it('should append the string when condition is true', () => {
      sb.appendLineIf(true, 'line1');
      expect(sb.toString()).toBe('line1\n');
    });

    it('should not append the string when condition is false', () => {
      sb.appendLineIf(false, 'line1');
      expect(sb.toString()).toBe('');
    });

    it('should append the string when condition is a function returning true', () => {
      sb.appendLineIf(() => true, 'line1');
      expect(sb.toString()).toBe('line1\n');
    });

    it('should not append the string when condition is a function returning false', () => {
      sb.appendLineIf(() => false, 'line1');
      expect(sb.toString()).toBe('');
    });
  });

  describe('prependIf', () => {
    it('should prepend the specified value if the condition is true', () => {
      const builder = new SourceBuilder().append('bar').prependIf(true, 'foo');
      expect(builder.toString()).toBe('foobar');
    });

    it('should not prepend the specified value if the condition is false', () => {
      const builder = new SourceBuilder().append('bar').prependIf(false, 'foo');
      expect(builder.toString()).toBe('bar');
    });
  });

  describe('prependLineIf', () => {
    it('should prepend the specified value with a line terminator if the condition is true', () => {
      const builder = new SourceBuilder({ newLine: '\n' }).append('bar').prependLineIf(true, 'foo');
      expect(builder.toString()).toBe('foo\nbar');
    });

    it('should not prepend the specified value if the condition is false', () => {
      const builder = new SourceBuilder().append('bar').prependLineIf(false, 'foo');
      expect(builder.toString()).toBe('bar');
    });
  });

  describe('appendWithLinePrefix', () => {
    it('should append the specified values with the specified line prefix', () => {
      const builder = new SourceBuilder().appendWithLinePrefix('// ', 'foo', 'bar');
      expect(builder.toString()).toBe('// foobar');
    });

    it('should handle null and undefined values', () => {
      const builder = new SourceBuilder().appendWithLinePrefix('// ', 'foo', null, undefined, 'bar');
      expect(builder.toString()).toBe('// foobar');
    });

    it('should apply the provided builder function with the specified line prefix', () => {
      const builder = new SourceBuilder({ newLine: '\n' }).appendWithLinePrefix('// ', (b) => {
        b.appendLine('foo');
        b.appendLine('bar');
      });
      expect(builder.toString()).toBe('// foo\n// bar\n');
    });

    it('should apply the provided builder function with the specified line prefix and indentation', () => {
      const builder = new SourceBuilder({ newLine: '\n' }).indent((b) =>
        b.appendWithLinePrefix('// ', (b) => {
          b.appendLine('foo');
          b.appendLine('bar');
        })
      );
      expect(builder.toString()).toBe('  // foo\n  // bar\n');
    });

    it('should write indents after the prefix', () => {
      const builder = new SourceBuilder({ newLine: '\n' }).indent((b) =>
        b.appendWithLinePrefix('// ', (b) => {
          b.indent((b) => b.appendLine('foo'));
        })
      );
      expect(builder.toString()).toBe('  //   foo\n');
    });
  });

  describe('appendLineWithLinePrefix', () => {
    it('should append the specified values as a new line with the specified line prefix', () => {
      const builder = new SourceBuilder({ newLine: '\n' }).appendLineWithLinePrefix('// ', 'foo', 'bar');
      expect(builder.toString()).toBe('// foobar' + '\n');
    });

    it('should handle null and undefined values', () => {
      const builder = new SourceBuilder({ newLine: '\n' }).appendLineWithLinePrefix(
        '// ',
        'foo',
        null,
        undefined,
        'bar',
      );
      expect(builder.toString()).toBe('// foobar' + '\n');
    });
  });

  describe('ensurePreviousLineEmpty', () => {
    it('should insert one empty line when current line is empty', () => {
      sb.append('line1', '\n', 'line2', '\n');
      sb.ensurePreviousLineEmpty();
      expect(sb.toString()).toBe('line1\nline2\n\n');
    });

    it('should insert two empty lines when current line is not empty', () => {
      sb.append('line1', '\n', 'line2');
      sb.ensurePreviousLineEmpty();
      expect(sb.toString()).toBe('line1\nline2\n\n');
    });

    it('should not insert an empty line when already empty', () => {
      sb.append('line1', '\n', 'line2', '\n', '\n');
      sb.ensurePreviousLineEmpty();
      expect(sb.toString()).toBe('line1\nline2\n\n');
    });
  });

  describe('ensureCurrentLineEmpty', () => {
    it('should insert an empty line', () => {
      sb.append('line1', '\n', 'line2');
      sb.ensureCurrentLineEmpty();
      expect(sb.toString()).toBe('line1\nline2\n');
    });

    it('should not insert an empty line when already empty', () => {
      sb.append('line1', '\n', 'line2', '\n');
      sb.ensureCurrentLineEmpty();
      expect(sb.toString()).toBe('line1\nline2\n');
    });
  });

  describe('pretendPreviousLineEmpty', () => {
    it('should pretend the previous line is empty', () => {
      sb.appendLine('line1').append('a').pretendPreviousLineEmpty().ensurePreviousLineEmpty().append('b');
      expect(sb.toString()).toBe('line1\nab');
    });
  });

  describe('pretendCurrentLineEmpty', () => {
    it('should pretend the previous line is empty', () => {
      sb.append('a').pretendCurrentLineEmpty().ensureCurrentLineEmpty().append('b');
      expect(sb.toString()).toBe(`ab`);
    });
  });

  describe('if', () => {
    it('should append the content when condition is true', () => {
      sb.if(true, (x) => x.append('stuff'));
      expect(sb.toString()).toBe(`stuff`);
    });

    it('should not append the content when condition is false', () => {
      sb.if(false, (x) => x.append('stuff'));
      expect(sb.toString()).toBe(``);
    });

    it('should append the content when condition function returns true', () => {
      sb.if(
        () => true,
        (x) => x.append('stuff'),
      );
      expect(sb.toString()).toBe(`stuff`);
    });

    it('should not append the content when condition function returns false', () => {
      sb.if(
        () => false,
        (x) => x.append('stuff'),
      );
      expect(sb.toString()).toBe(``);
    });

    it('should append the correct content when condition is true', () => {
      sb.if(
        true,
        (x) => x.append('stuff'),
        (x) => x.append('other stuff'),
      );
      expect(sb.toString()).toBe(`stuff`);
    });

    it('should append the correct content when condition is false', () => {
      sb.if(
        false,
        (x) => x.append('stuff'),
        (x) => x.append('other stuff'),
      );
      expect(sb.toString()).toBe(`other stuff`);
    });

    it('should append the correct content when condition function returns true', () => {
      sb.if(
        () => true,
        (x) => x.append('stuff'),
        (x) => x.append('other stuff'),
      );
      expect(sb.toString()).toBe(`stuff`);
    });

    it('should append the correct content when condition function returns false', () => {
      sb.if(
        () => false,
        (x) => x.append('stuff'),
        (x) => x.append('other stuff'),
      );
      expect(sb.toString()).toBe(`other stuff`);
    });
  });

  describe('indent', () => {
    it('should correctly indent the content (fn)', () => {
      sb.append('line1', '\n');
      sb.indent((innerSb) => {
        innerSb.append('line2', '\n');
      });
      sb.append('line3', '\n');
      expect(sb.toString()).toBe('line1\n  line2\nline3\n');
    });

    it('should correctly indent the content (string)', () => {
      sb.append('line1', '\n');
      sb.indent('line2\n');
      sb.append('line3', '\n');
      expect(sb.toString()).toBe('line1\n  line2\nline3\n');
    });

    it('should correctly handle nested indentation', () => {
      sb.indent((innerSb1) => {
        innerSb1.append('line1', '\n');
        innerSb1.indent((innerSb2) => {
          innerSb2.append('line2', '\n');
        });
        innerSb1.append('line3', '\n');
      });
      expect(sb.toString()).toBe('  line1\n    line2\n  line3\n');
    });

    it('should correctly handle multiline strings (fn)', () => {
      sb.indent((innerSb) => {
        innerSb.append('line1\nline2', '\n');
      });
      expect(sb.toString()).toBe('  line1\n  line2\n');
    });

    it('should correctly handle multiline strings (string)', () => {
      sb.indent('line1\nline2\n');
      expect(sb.toString()).toBe('  line1\n  line2\n');
    });

    it('should nest indentations', () => {
      sb.appendLine('(')
        .indent((b1) => {
          b1.appendLine('(')
            .indent((b2) => {
              b2.appendLine('line1');
            })
            .appendLine(')');
        })
        .appendLine(')');
      expect(sb.toString()).toBe('(\n  (\n    line1\n  )\n)\n');
    });
  });

  describe('indentIf', () => {
    it('should indent when condition is true', () => {
      sb.indentIf(true, (x) => x.append('stuff'));
      expect(sb.toString()).toBe(`  stuff`);
    });

    it('should not indent when condition is false', () => {
      sb.indentIf(false, (x) => x.append('stuff'));
      expect(sb.toString()).toBe(`stuff`);
    });

    it('should indent when condition function returns true', () => {
      sb.indentIf(
        () => true,
        (x) => x.append('stuff'),
      );
      expect(sb.toString()).toBe(`  stuff`);
    });

    it('should not indent when condition function returns false', () => {
      sb.indentIf(
        () => false,
        (x) => x.append('stuff'),
      );
      expect(sb.toString()).toBe(`stuff`);
    });
  });

  describe('parenthesize', () => {
    it('should parenthesize the content with the given brackets string', () => {
      sb.parenthesize('{}', (x) => x.append('stuff'));
      expect(sb.toString()).toBe(`{stuff}`);
    });

    it('should parenthesize the content with the given brackets array', () => {
      sb.parenthesize(['{', '}'], (x) => x.append('stuff'));
      expect(sb.toString()).toBe(`{stuff}`);
    });

    it('should parenthesize and indent the content (fn)', () => {
      sb.parenthesize('()', (x) => x.append('\nstuff\n'));
      expect(sb.toString()).toBe('(\n  stuff\n)');
    });

    it('should parenthesize and indent the content (string)', () => {
      sb.parenthesize('()', '\nstuff\n');
      expect(sb.toString()).toBe('(\n  stuff\n)');
    });

    it('should parenthesize but not indent the content when indent is false', () => {
      sb.parenthesize('()', (x) => x.append('\nstuff\n'), { indent: false });
      expect(sb.toString()).toBe('(\nstuff\n)');
    });

    it('should parenthesize the content with the given brackets string (multiline)', () => {
      sb.parenthesize('{}', (x) => x.append('stuff'), { multiline: true });
      expect(sb.toString()).toBe('{\n  stuff\n}');
    });

    it('should parenthesize the content with the given brackets array (multiline)', () => {
      sb.parenthesize(['{', '}'], (x) => x.append('stuff'), { multiline: true });
      expect(sb.toString()).toBe('{\n  stuff\n}');
    });

    it('should parenthesize and indent the content (fn) (multiline)', () => {
      sb.parenthesize('()', (x) => x.append('\nstuff\n'), { multiline: true });
      expect(sb.toString()).toBe('(\n\n  stuff\n)');
    });

    it('should parenthesize and indent the content (string) (multiline)', () => {
      sb.parenthesize('()', '\nstuff\n', { multiline: true });
      expect(sb.toString()).toBe('(\n\n  stuff\n)');
    });

    it('should parenthesize but not indent the content when indent is false (multiline)', () => {
      sb.parenthesize('()', (x) => x.append('\nstuff\n'), { multiline: true, indent: false });
      expect(sb.toString()).toBe('(\n\nstuff\n)');
    });

    it('should ignore first ensurePreviousLineEmpty', () => {
      sb.parenthesize('()', (x) => x.ensurePreviousLineEmpty().append('stuff'), { multiline: true });
      expect(sb.toString()).toBe('(\n  stuff\n)');
    });

    it('should not ignore first ensurePreviousLineEmpty if disabled', () => {
      sb.parenthesize('()', (x) => x.ensurePreviousLineEmpty().append('stuff'), {
        multiline: true,
        pretendEmpty: false,
      });
      expect(sb.toString()).toBe('(\n\n  stuff\n)');
    });
  });

  describe('parenthesizeIf', () => {
    it('should parenthesize when condition is true (fn)', () => {
      sb.parenthesizeIf(true, '()', (x) => x.append('stuff'));
      expect(sb.toString()).toBe(`(stuff)`);
    });

    it('should parenthesize when condition is true (string)', () => {
      sb.parenthesizeIf(true, '()', 'stuff');
      expect(sb.toString()).toBe(`(stuff)`);
    });

    it('should not parenthesize when condition is false', () => {
      sb.parenthesizeIf(false, '()', (x) => x.append('stuff'));
      expect(sb.toString()).toBe(`stuff`);
    });

    it('should parenthesize when condition function returns true', () => {
      sb.parenthesizeIf(
        () => true,
        '()',
        (x) => x.append('stuff'),
      );
      expect(sb.toString()).toBe(`(stuff)`);
    });

    it('should not parenthesize when condition function returns false', () => {
      sb.parenthesizeIf(
        () => false,
        '()',
        (x) => x.append('stuff'),
      );
      expect(sb.toString()).toBe(`stuff`);
    });

    it('should parenthesize when condition is true (fn) (multiline)', () => {
      sb.parenthesizeIf(true, '()', (x) => x.append('stuff'), { multiline: true });
      expect(sb.toString()).toBe('(\n  stuff\n)');
    });

    it('should parenthesize when condition is true (string) (multiline)', () => {
      sb.parenthesizeIf(true, '()', 'stuff', { multiline: true });
      expect(sb.toString()).toBe('(\n  stuff\n)');
    });

    it('should not parenthesize when condition is false (multiline)', () => {
      sb.parenthesizeIf(false, '()', (x) => x.append('stuff'), { multiline: true });
      expect(sb.toString()).toBe(`stuff`);
    });

    it('should parenthesize when condition function returns true (multiline)', () => {
      sb.parenthesizeIf(
        () => true,
        '()',
        (x) => x.append('stuff'),
        { multiline: true },
      );
      expect(sb.toString()).toBe('(\n  stuff\n)');
    });

    it('should not parenthesize when condition function returns false (multiline)', () => {
      sb.parenthesizeIf(
        () => false,
        '()',
        (x) => x.append('stuff'),
        { multiline: true },
      );
      expect(sb.toString()).toBe(`stuff`);
    });
  });

  describe('forEach', () => {
    it('should add the content for each item', () => {
      sb.forEach(['a', 'b', 'c'], (x, item) => x.append(`(${item})`));
      expect(sb.toString()).toBe(`(a)(b)(c)`);
    });

    it('should add the content for items that match the condition', () => {
      sb.forEach(['a', 'b', 'c'], (x, item) => x.append(`(${item})`), { condition: (item) => item === 'b' });
      expect(sb.toString()).toBe(`(b)`);
    });

    it('should add the content for each item with the given string separator', () => {
      sb.forEach(['a', 'b', 'c'], (x, item) => x.append(`item: ${item}`), { separator: ', ' });
      expect(sb.toString()).toBe(`item: a, item: b, item: c`);
    });

    it('should add the content for each item with the given separator builder', () => {
      sb.forEach(['a', 'b', 'c'], (x, item) => x.append(`item: ${item}`), {
        separator: (x, p, n, pi, ni) => x.append(`(${p}:${pi}), (${n}:${ni})`),
      });
      expect(sb.toString()).toBe(`item: a(a:0), (b:1)item: b(b:1), (c:2)item: c`);
    });

    it('should add the content for items that match the condition with the given string separator', () => {
      sb.forEach(['a', 'b', 'c'], (x, item) => x.append(`item: ${item}`), {
        condition: (item) => item === 'a' || item === 'c',
        separator: ', ',
      });
      expect(sb.toString()).toBe(`item: a, item: c`);
    });

    it('should add the content for items that match the condition with the given separator builder', () => {
      sb.forEach(['a', 'b', 'c'], (x, item) => x.append(`item: ${item}`), {
        condition: (item) => item === 'a' || item === 'c',
        separator: (x, p, n, pi, ni) => x.append(`(${p}:${pi}), (${n}:${ni})`),
      });
      expect(sb.toString()).toBe(`item: a(a:0), (c:2)item: c`);
    });
  });

  describe('forEachIf', () => {
    it('should add the content for each item when condition is true', () => {
      sb.forEachIf(true, ['a', 'b', 'c'], (x, item) => x.append(`(${item})`));
      expect(sb.toString()).toBe(`(a)(b)(c)`);
    });

    it('should not add the content for each item when condition is false', () => {
      sb.forEachIf(false, ['a', 'b', 'c'], (x, item) => x.append(`(${item})`));
      expect(sb.toString()).toBe(``);
    });
  });

  describe('appendSeparated', () => {
    it('should add the content for each item with the given string separator', () => {
      sb.appendSeparated(['a', 'b', 'c'], ', ');
      expect(sb.toString()).toBe(`a, b, c`);
    });
  });

  describe('appendSeparatedIf', () => {
    it('should add the content for each item with the given string separator when condition is true', () => {
      sb.appendSeparatedIf(true, ['a', 'b', 'c'], ', ');
      expect(sb.toString()).toBe(`a, b, c`);
    });

    it('should not add the content for each item with the given string separator when condition is false', () => {
      sb.appendSeparatedIf(false, ['a', 'b', 'c'], ', ');
      expect(sb.toString()).toBe(``);
    });
  });
});

describe('builderTemplate', () => {
  it('should resolve append values in a template string', () => {
    const sb = new SourceBuilder({ newLine: '\n' });
    sb.append(
      builderTemplate`abc${'def'}ghi${123}jkl${(b) => b.append('mno')}pqr${appendValueGroup(['stu', 'vxw'])}yz`,
    );
    expect(sb.toString()).toEqual('abcdefghi123jklmnopqrstuvxwyz');
  });

  it('should remove indentation based on last line', () => {
    const sb = new SourceBuilder({ newLine: '\n' });
    sb.append(
      builderTemplate`${'abc'}
        ${123}
         ghi`,
    );
    expect(sb.toString()).toEqual('abc\n123\nghi');
  });

  describe('indent', () => {
    it('should indent the content', () => {
      const sb = new SourceBuilder({ newLine: '\n' });
      sb.append(
        builderTemplate.indent`${'abc'}
          ${123}
          ghi`,
      );
      expect(sb.toString()).toEqual('  abc\n  123\n  ghi');
    });
  });
});
