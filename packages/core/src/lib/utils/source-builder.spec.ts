import { EOL } from 'os';

import { SourceBuilder } from './source-builder.js';

describe('SourceBuilder', () => {
  let sb: SourceBuilder;

  beforeEach(() => {
    sb = new SourceBuilder();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const options = sb.options;
      expect(options.indent).toEqual({ type: 'spaces', count: 2 });
      expect(options.newLine).toBe(EOL);
      expect(options.charsTreatedAsEmptyLine).toEqual(['{']);
    });
  });

  describe('append', () => {
    it('should handle consecutive line breaks', () => {
      sb.append('line1', EOL, EOL, EOL, 'line2');
      expect(sb.toString()).toBe(`line1${EOL}${EOL}${EOL}line2`);
    });

    it('should handle mixed line breaks', () => {
      sb.append('line1\r\n', '\n', 'line2\r', '\r', 'line3');
      expect(sb.toString()).toBe(`line1${EOL}${EOL}line2line3`);
    });

    it('should handle strings with special chars', () => {
      sb.append('line1 {', EOL, 'line2}');
      expect(sb.toString()).toBe(`line1 {${EOL}line2}`);
    });

    it('should handle long strings without line breaks', () => {
      sb.append('This is a long string without any line breaks.');
      expect(sb.toString()).toBe('This is a long string without any line breaks.');
    });

    it('should handle multiple calls', () => {
      sb.append('line1', EOL);
      sb.append('line2', EOL);
      sb.append('line3', EOL);
      expect(sb.toString()).toBe(`line1${EOL}line2${EOL}line3${EOL}`);
    });

    it('should handle empty input', () => {
      sb.append('', '', '', EOL, '', '');
      expect(sb.toString()).toBe(EOL);
    });
  });

  describe('appendIf', () => {
    it('should append the string when condition is true', () => {
      sb.appendIf(true, 'line1', EOL);
      expect(sb.toString()).toBe(`line1${EOL}`);
    });

    it('should not append the string when condition is false', () => {
      sb.appendIf(false, 'line1', EOL);
      expect(sb.toString()).toBe('');
    });

    it('should append the string when condition is a function returning true', () => {
      sb.appendIf(() => true, 'line1', EOL);
      expect(sb.toString()).toBe(`line1${EOL}`);
    });

    it('should not append the string when condition is a function returning false', () => {
      sb.appendIf(() => false, 'line1', EOL);
      expect(sb.toString()).toBe('');
    });
  });

  describe('appendLineIf', () => {
    it('should append the string when condition is true', () => {
      sb.appendLineIf(true, 'line1');
      expect(sb.toString()).toBe(`line1${EOL}`);
    });

    it('should not append the string when condition is false', () => {
      sb.appendLineIf(false, 'line1');
      expect(sb.toString()).toBe('');
    });

    it('should append the string when condition is a function returning true', () => {
      sb.appendLineIf(() => true, 'line1');
      expect(sb.toString()).toBe(`line1${EOL}`);
    });

    it('should not append the string when condition is a function returning false', () => {
      sb.appendLineIf(() => false, 'line1');
      expect(sb.toString()).toBe('');
    });
  });

  describe('ensurePreviousLineEmpty', () => {
    it('should insert one empty line when current line is empty', () => {
      sb.append('line1', EOL, 'line2', EOL);
      sb.ensurePreviousLineEmpty();
      expect(sb.toString()).toBe(`line1${EOL}line2${EOL}${EOL}`);
    });

    it('should insert two empty lines when current line is not empty', () => {
      sb.append('line1', EOL, 'line2');
      sb.ensurePreviousLineEmpty();
      expect(sb.toString()).toBe(`line1${EOL}line2${EOL}${EOL}`);
    });

    it('should not insert an empty line when already empty', () => {
      sb.append('line1', EOL, 'line2', EOL, EOL);
      sb.ensurePreviousLineEmpty();
      expect(sb.toString()).toBe(`line1${EOL}line2${EOL}${EOL}`);
    });

    it('should not insert an empty line when empty by characters', () => {
      sb.append('line1', EOL, '{ \t', EOL);
      sb.ensurePreviousLineEmpty();
      expect(sb.toString()).toBe(`line1${EOL}{ \t${EOL}`);
    });
  });

  describe('ensureCurrentLineEmpty', () => {
    it('should insert an empty line', () => {
      sb.append('line1', EOL, 'line2');
      sb.ensureCurrentLineEmpty();
      expect(sb.toString()).toBe(`line1${EOL}line2${EOL}`);
    });

    it('should not insert an empty line when already empty', () => {
      sb.append('line1', EOL, 'line2', EOL);
      sb.ensureCurrentLineEmpty();
      expect(sb.toString()).toBe(`line1${EOL}line2${EOL}`);
    });

    it('should not insert an empty line when empty by characters', () => {
      sb.append('line1', EOL, '{ \t');
      sb.ensureCurrentLineEmpty();
      expect(sb.toString()).toBe(`line1${EOL}{ \t`);
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
        (x) => x.append('stuff')
      );
      expect(sb.toString()).toBe(`stuff`);
    });

    it('should not append the content when condition function returns false', () => {
      sb.if(
        () => false,
        (x) => x.append('stuff')
      );
      expect(sb.toString()).toBe(``);
    });
  });

  describe('ifElse', () => {
    it('should append the correct content when condition is true', () => {
      sb.ifElse(
        true,
        (x) => x.append('stuff'),
        (x) => x.append('other stuff')
      );
      expect(sb.toString()).toBe(`stuff`);
    });

    it('should append the correct content when condition is false', () => {
      sb.ifElse(
        false,
        (x) => x.append('stuff'),
        (x) => x.append('other stuff')
      );
      expect(sb.toString()).toBe(`other stuff`);
    });

    it('should append the correct content when condition function returns true', () => {
      sb.ifElse(
        () => true,
        (x) => x.append('stuff'),
        (x) => x.append('other stuff')
      );
      expect(sb.toString()).toBe(`stuff`);
    });

    it('should append the correct content when condition function returns false', () => {
      sb.ifElse(
        () => false,
        (x) => x.append('stuff'),
        (x) => x.append('other stuff')
      );
      expect(sb.toString()).toBe(`other stuff`);
    });
  });

  describe('indent', () => {
    it('should correctly indent the content', () => {
      sb.append('line1', EOL);
      sb.indent((innerSb) => {
        innerSb.append('line2', EOL);
      });
      sb.append('line3', EOL);
      expect(sb.toString()).toBe(`line1${EOL}  line2${EOL}line3${EOL}`);
    });

    it('should correctly handle nested indentation', () => {
      sb.indent((innerSb1) => {
        innerSb1.append('line1', EOL);
        innerSb1.indent((innerSb2) => {
          innerSb2.append('line2', EOL);
        });
        innerSb1.append('line3', EOL);
      });
      expect(sb.toString()).toBe(`  line1${EOL}    line2${EOL}  line3${EOL}`);
    });

    it('should correctly handle multiline strings', () => {
      sb.indent((innerSb) => {
        innerSb.append(`line1${EOL}line2`, EOL);
      });
      expect(sb.toString()).toBe(`  line1${EOL}  line2${EOL}`);
    });

    it('should indent when condition is true', () => {
      sb.indent((x) => x.append('stuff'), true);
      expect(sb.toString()).toBe(`  stuff`);
    });

    it('should not indent when condition is false', () => {
      sb.indent((x) => x.append('stuff'), false);
      expect(sb.toString()).toBe(`stuff`);
    });

    it('should indent when condition function returns true', () => {
      sb.indent(
        (x) => x.append('stuff'),
        () => true
      );
      expect(sb.toString()).toBe(`  stuff`);
    });

    it('should not indent when condition function returns false', () => {
      sb.indent(
        (x) => x.append('stuff'),
        () => false
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

    it('should parenthesize and indent the content', () => {
      sb.parenthesize('()', (x) => x.append(`${EOL}stuff${EOL}`));
      expect(sb.toString()).toBe(`(${EOL}  stuff${EOL})`);
    });

    it('should parenthesize but not indent the content when indent is false', () => {
      sb.parenthesize('()', (x) => x.append(`${EOL}stuff${EOL}`), false);
      expect(sb.toString()).toBe(`(${EOL}stuff${EOL})`);
    });
  });

  describe('parenthesizeIf', () => {
    it('should parenthesize when condition is true', () => {
      sb.parenthesizeIf(true, '()', (x) => x.append('stuff'));
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
        (x) => x.append('stuff')
      );
      expect(sb.toString()).toBe(`(stuff)`);
    });

    it('should not parenthesize when condition function returns false', () => {
      sb.parenthesizeIf(
        () => false,
        '()',
        (x) => x.append('stuff')
      );
      expect(sb.toString()).toBe(`stuff`);
    });
  });

  describe('forEach', () => {
    it('should add the content for each item', () => {
      sb.forEach(['a', 'b', 'c'], (x, item) => x.append(`(${item})`));
      expect(sb.toString()).toBe(`(a)(b)(c)`);
    });
  });

  describe('forEachIf', () => {
    it('should add the content for each item when condition is true', () => {
      sb.forEachIf(['a', 'b', 'c'], true, (x, item) => x.append(`(${item})`));
      expect(sb.toString()).toBe(`(a)(b)(c)`);
    });

    it('should not add the content for each item when condition is false', () => {
      sb.forEachIf(['a', 'b', 'c'], false, (x, item) => x.append(`(${item})`));
      expect(sb.toString()).toBe(``);
    });
  });

  describe('forEachMatching', () => {
    it('should add the content for items that match the condition', () => {
      sb.forEachMatching(
        ['a', 'b', 'c'],
        (item) => item === 'b',
        (x, item) => x.append(`(${item})`)
      );
      expect(sb.toString()).toBe(`(b)`);
    });
  });

  describe('forEachSeparated', () => {
    it('should add the content for each item with the given string separator', () => {
      sb.forEachSeparated(['a', 'b', 'c'], ', ', (x, item) => x.append(`item: ${item}`));
      expect(sb.toString()).toBe(`item: a, item: b, item: c`);
    });

    it('should add the content for each item with the given separator builder', () => {
      sb.forEachSeparated(
        ['a', 'b', 'c'],
        (x, p, n, pi, ni) => x.append(`(${p}:${pi}), (${n}:${ni})`),
        (x, item) => x.append(`item: ${item}`)
      );
      expect(sb.toString()).toBe(`item: a(a:0), (b:1)item: b(b:1), (c:2)item: c`);
    });
  });

  describe('forEachMatchingSeparated', () => {
    it('should add the content for items that match the condition with the given string separator', () => {
      sb.forEachMatchingSeparated(
        ['a', 'b', 'c'],
        (item) => item === 'a' || item === 'c',
        ', ',
        (x, item) => x.append(`item: ${item}`)
      );
      expect(sb.toString()).toBe(`item: a, item: c`);
    });

    it('should add the content for items that match the condition with the given separator builder', () => {
      sb.forEachMatchingSeparated(
        ['a', 'b', 'c'],
        (item) => item === 'a' || item === 'c',
        (x, p, n, pi, ni) => x.append(`(${p}:${pi}), (${n}:${ni})`),
        (x, item) => x.append(`item: ${item}`)
      );
      expect(sb.toString()).toBe(`item: a(a:0), (c:2)item: c`);
    });
  });
});