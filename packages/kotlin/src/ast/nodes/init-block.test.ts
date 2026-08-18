import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../config.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktInitBlock } from './init-block.ts';

describe('ktInitBlock', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new KotlinFileBuilder(
      undefined,
      { ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig,
    );
  });

  it('should write an empty init block', () => {
    builder.append(ktInitBlock(''));
    expect(builder.toString(false)).toBe('init {}\n');
  });

  it('should write an init block with a single statement', () => {
    builder.append(ktInitBlock('println("Hello")'));
    expect(builder.toString(false)).toBe('init {\n    println("Hello")\n}\n');
  });

  it('should write an init block with multiple statements', () => {
    builder.append(ktInitBlock((b) => b.appendLine('println("Hello")').appendLine('println("World")')));
    expect(builder.toString(false)).toBe('init {\n    println("Hello")\n    println("World")\n}\n');
  });

  it('should render injections', () => {
    builder.append(ktInitBlock('println("Hello")', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe('beforeinit {\n    println("Hello")\n}\nafter');
  });
});
