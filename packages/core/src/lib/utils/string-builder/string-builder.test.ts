import { EOL } from 'node:os';

import type { StringBuilderOptions } from './options.ts';
import { StringBuilder } from './string-builder.ts';
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

describe('fromString', () => {
  it('should create a StringBuilder instance with the given string', () => {
    const str = 'test string';
    const sb = StringBuilder.fromString(str);
    expect(sb.toString()).toEqual(str);
  });

  // Find alternative for objectContaining in Deno
  // it('should create a StringBuilder instance with the given string and options', () => {
  //   const str = 'test string';
  //   const options: Partial<StringBuilderOptions> = {
  //     newLine: '\r\n',
  //   };
  //   const sb = StringBuilder.fromString(str, options);
  //   expect(sb.toString()).toEqual(str);
  //   expect(sb.options).toEqual(expect.objectContaining(options));
  // });
});

describe('build', () => {
  it('should build a string using a StringBuilder build action', () => {
    const buildAction = (builder: StringBuilder) => {
      builder.append('hello');
      builder.append('world');
    };
    const result = StringBuilder.build(buildAction);
    expect(result).toEqual('helloworld');
  });

  it('should build a string using a StringBuilder build action and options', () => {
    const buildAction = (builder: StringBuilder) => {
      builder.appendLine('hello');
      builder.append('world');
    };
    const options: Partial<StringBuilderOptions> = {
      newLine: '\r\n--',
    };
    const result = StringBuilder.build(buildAction, options);
    expect(result).toEqual(`hello${options.newLine}world`);
  });
});

describe('append', () => {
  it('should append a string to the end of the StringBuilder', () => {
    const sb = new StringBuilder();
    sb.append('hello');
    expect(sb.toString()).toEqual('hello');
  });

  it('should append multiple strings to the end of the StringBuilder', () => {
    const sb = new StringBuilder();
    sb.append('hello', ' ', 'world');
    expect(sb.toString()).toEqual('hello world');
  });

  it('should ignore nullish or empty strings', () => {
    const sb = new StringBuilder();
    sb.append('', null, undefined, 'hello');
    expect(sb.toString()).toEqual('hello');
  });
});

describe('appendLine', () => {
  it('should append a string followed by a new line to the end of the StringBuilder', () => {
    const sb = new StringBuilder();
    sb.appendLine('hello');
    expect(sb.toString()).toEqual(`hello${EOL}`);
  });

  it('should append multiple strings followed by a new line to the end of the StringBuilder', () => {
    const sb = new StringBuilder();
    sb.appendLine('hello', 'world');
    expect(sb.toString()).toEqual(`helloworld${EOL}`);
  });

  it('should ignore nullish or empty strings', () => {
    const sb = new StringBuilder();
    sb.appendLine('', null, undefined, 'hello');
    expect(sb.toString()).toEqual(`hello${EOL}`);
  });

  it('should append a string followed by a custom new line to the end of the StringBuilder', () => {
    const options: StringBuilderOptions = {
      newLine: '\r\n--',
    };
    const sb = new StringBuilder(options);
    sb.appendLine('hello');
    expect(sb.toString()).toEqual(`hello${options.newLine}`);
  });
});

describe('prepend', () => {
  it('should prepend a string to the beginning of the StringBuilder', () => {
    const sb = new StringBuilder();
    sb.append('world');
    sb.prepend('hello ');
    expect(sb.toString()).toEqual('hello world');
  });

  it('should prepend multiple strings to the beginning of the StringBuilder', () => {
    const sb = new StringBuilder();
    sb.append('world');
    sb.prepend('hello ', 'there, ');
    expect(sb.toString()).toEqual('hello there, world');
  });

  it('should ignore nullish or empty strings', () => {
    const sb = new StringBuilder();
    sb.append('world');
    sb.prepend('', null, undefined, 'hello ');
    expect(sb.toString()).toEqual('hello world');
  });

  it('should prepend a string built by another StringBuilder', () => {
    const sb = new StringBuilder();
    sb.append('world');
    sb.prepend((builder) => builder.append('hello '));
    expect(sb.toString()).toEqual('hello world');
  });

  it('should create the StringBuilder for the function with the same options as the current StringBuilder', () => {
    const options: StringBuilderOptions = {
      newLine: '\r\n--',
    };
    const sb = new StringBuilder(options);
    sb.append('world');
    sb.prepend((builder) => builder.appendLine('hello '));
    expect(sb.toString()).toEqual(`hello ${options.newLine}world`);
  });
});

describe('prependLine', () => {
  it('should prepend a string followed by a new line to the beginning of the StringBuilder', () => {
    const sb = new StringBuilder();
    sb.append('world');
    sb.prependLine('hello');
    expect(sb.toString()).toEqual(`hello${EOL}world`);
  });

  it('should prepend a string followed by a custom new line to the beginning of the StringBuilder', () => {
    const options: StringBuilderOptions = {
      newLine: '\r\n--',
    };
    const sb = new StringBuilder(options);
    sb.append('world');
    sb.prependLine('hello');
    expect(sb.toString()).toEqual(`hello${options.newLine}world`);
  });

  it('should prepend multiple strings followed by a new line to the beginning of the StringBuilder', () => {
    const sb = new StringBuilder();
    sb.append('world');
    sb.prependLine('hello', 'there');
    expect(sb.toString()).toEqual(`hellothere${EOL}world`);
  });

  it('should ignore nullish or empty strings', () => {
    const sb = new StringBuilder();
    sb.append('world');
    sb.prependLine('', null, undefined, 'hello');
    expect(sb.toString()).toEqual(`hello${EOL}world`);
  });

  it('should prepend a string built by another StringBuilder', () => {
    const sb = new StringBuilder();
    sb.append('world');
    sb.prependLine((builder) => builder.append('hello '));
    expect(sb.toString()).toEqual(`hello ${EOL}world`);
  });

  it('should create the StringBuilder for the function with the same options as the current StringBuilder', () => {
    const options: StringBuilderOptions = {
      newLine: '\r\n--',
    };
    const sb = new StringBuilder(options);
    sb.append('world');
    sb.prependLine((builder) => builder.appendLine('hello '));
    expect(sb.toString()).toEqual(`hello ${options.newLine}${options.newLine}world`);
  });
});
