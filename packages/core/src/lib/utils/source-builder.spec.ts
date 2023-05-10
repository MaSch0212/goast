import { EOL } from 'os';

import { SourceBuilder } from './source-builder.js';

describe('SourceBuilder', () => {
  let sb: SourceBuilder;

  beforeEach(() => {
    sb = new SourceBuilder();
  });

  test('constructor should initialize with default options', () => {
    const options = sb.options;
    expect(options.indent).toEqual({ type: 'spaces', count: 2 });
    expect(options.newLine).toBe(EOL);
    expect(options.charsTreatedAsEmptyLine).toEqual(['{']);
  });

  test('append should handle consecutive line breaks', () => {
    sb.append('line1', EOL, EOL, EOL, 'line2');
    expect(sb.toString()).toBe(`line1${EOL}${EOL}${EOL}line2`);
  });

  test('append should handle mixed line breaks', () => {
    sb.append('line1\r\n', '\n', 'line2\r', '\r', 'line3');
    expect(sb.toString()).toBe(`line1${EOL}${EOL}line2line3`);
  });

  test('append should handle strings with special chars', () => {
    sb.append('line1 {', EOL, 'line2}');
    expect(sb.toString()).toBe(`line1 {${EOL}line2}`);
  });

  test('append should handle long strings without line breaks', () => {
    sb.append('This is a long string without any line breaks.');
    expect(sb.toString()).toBe('This is a long string without any line breaks.');
  });

  test('append should handle multiple calls', () => {
    sb.append('line1', EOL);
    sb.append('line2', EOL);
    sb.append('line3', EOL);
    expect(sb.toString()).toBe(`line1${EOL}line2${EOL}line3${EOL}`);
  });

  test('append should handle empty input', () => {
    sb.append('', '', '', EOL, '', '');
    expect(sb.toString()).toBe(EOL);
  });

  test('ensurePreviousLineEmpty should insert an empty line', () => {
    sb.append('line1', EOL, 'line2');
    sb.ensurePreviousLineEmpty();
    expect(sb.toString()).toBe(`line1${EOL}line2${EOL}`);
  });

  test('ensurePreviousLineEmpty should not insert an empty line when already empty', () => {
    sb.append('line1', EOL, 'line2', EOL, EOL);
    sb.ensurePreviousLineEmpty();
    expect(sb.toString()).toBe(`line1${EOL}line2${EOL}${EOL}`);
  });

  test('ensurePreviousLineEmpty should not insert an empty line when empty by characters', () => {
    sb.append('line1', EOL, '{ \t', EOL);
    sb.ensurePreviousLineEmpty();
    expect(sb.toString()).toBe(`line1${EOL}{ \t${EOL}`);
  });

  test('ensureCurrentLineEmpty should insert an empty line', () => {
    sb.append('line1', EOL, 'line2');
    sb.ensureCurrentLineEmpty();
    expect(sb.toString()).toBe(`line1${EOL}line2${EOL}`);
  });

  test.only('ensureCurrentLineEmpty should not insert an empty line when already empty', () => {
    sb.append('line1', EOL, 'line2', EOL);
    sb.ensureCurrentLineEmpty();
    expect(sb.toString()).toBe(`line1${EOL}line2${EOL}`);
  });

  test('ensureCurrentLineEmpty should not insert an empty line when empty by characters', () => {
    sb.append('line1', EOL, '{ \t');
    sb.ensureCurrentLineEmpty();
    expect(sb.toString()).toBe(`line1${EOL}{ \t`);
  });

  test('indent should correctly indent the content', () => {
    sb.append('line1', EOL);
    sb.indent((innerSb) => {
      innerSb.append('line2', EOL);
    });
    sb.append('line3', EOL);
    expect(sb.toString()).toBe(`line1${EOL}  line2${EOL}line3${EOL}`);
  });

  test('indent should correctly handle nested indentation', () => {
    sb.indent((innerSb1) => {
      innerSb1.append('line1', EOL);
      innerSb1.indent((innerSb2) => {
        innerSb2.append('line2', EOL);
      });
      innerSb1.append('line3', EOL);
    });
    expect(sb.toString()).toBe(`  line1${EOL}    line2${EOL}  line3${EOL}`);
  });

  test('indent should correctly handle multiline strings', () => {
    sb.indent((innerSb) => {
      innerSb.append(`line1${EOL}line2`, EOL);
    });
    console.log(`"${sb.toString()}"`);
    expect(sb.toString()).toBe(`  line1${EOL}  line2${EOL}`);
  });
});
