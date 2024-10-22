import { EOL } from 'node:os';

import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktInitBlock } from './init-block.ts';

describe('ktInitBlock', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should write an empty init block', () => {
    builder.append(ktInitBlock(''));
    expect(builder.toString(false)).toBe(`init {}${EOL}`);
  });

  it('should write an init block with a single statement', () => {
    builder.append(ktInitBlock('println("Hello")'));
    expect(builder.toString(false)).toBe(`init {${EOL}    println("Hello")${EOL}}${EOL}`);
  });

  it('should write an init block with multiple statements', () => {
    builder.append(ktInitBlock((b) => b.appendLine('println("Hello")').appendLine('println("World")')));
    expect(builder.toString(false)).toBe(`init {${EOL}    println("Hello")${EOL}    println("World")${EOL}}${EOL}`);
  });

  it('should render injections', () => {
    builder.append(ktInitBlock('println("Hello")', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`beforeinit {${EOL}    println("Hello")${EOL}}${EOL}after`);
  });
});
