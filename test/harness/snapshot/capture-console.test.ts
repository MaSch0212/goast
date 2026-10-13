import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { captureConsole } from './capture-console.ts';

describe('captureConsole', () => {
  it('captures output and returns the value', async () => {
    const result = await captureConsole(() => {
      console.log('generating a');
      console.warn('careful');
      return 42;
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toBe(42);
    expect(result.output).toBe('generating a\ncareful\n');
  });

  it('captures output and returns the error instead of throwing', async () => {
    const result = await captureConsole(() => {
      console.log('partial work');
      throw new Error('boom');
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false && (result.error as Error).message).toBe('boom');
    expect(result.output).toBe('partial work\n');
  });

  it('awaits async work', async () => {
    const result = await captureConsole(async () => {
      await Promise.resolve();
      console.info('async line');
      return 'done';
    });

    expect(result.ok && result.value).toBe('done');
    expect(result.output).toBe('async line\n');
  });

  it('restores console even when the function throws', async () => {
    const before = console.log;
    await captureConsole(() => {
      throw new Error('boom');
    });
    expect(console.log).toBe(before);
  });

  it('formats multiple arguments the way console does', async () => {
    const result = await captureConsole(() => {
      console.log('count:', 3, { a: 1 });
    });
    expect(result.output).toBe('count: 3 { a: 1 }\n');
  });
});
