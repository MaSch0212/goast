import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { addSourceIfTest } from './internal-utils.ts';

describe('addSourceIfTest', () => {
  it('adds __source__ when __test__ is set', () => {
    const result: Record<string, unknown> = {};
    addSourceIfTest({ __test__: true }, result, () => 'the source');
    expect(result.__source__).toBe('the source');
  });

  it('does nothing when __test__ is not set', () => {
    const result: Record<string, unknown> = {};
    addSourceIfTest({}, result, () => 'the source');
    expect('__source__' in result).toBe(false);
  });

  it('does not overwrite an existing __source__', () => {
    const result: Record<string, unknown> = { __source__: 'first' };
    addSourceIfTest({ __test__: true }, result, () => 'second');
    expect(result.__source__).toBe('first');
  });

  it('does not call the source function when it would not use the result', () => {
    let called = false;
    addSourceIfTest({}, {}, () => {
      called = true;
      return 'x';
    });
    expect(called).toBe(false);
  });
});
