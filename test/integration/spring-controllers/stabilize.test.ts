import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { RecordedResponse } from '../../cases/cases.ts';
import { NONDETERMINISTIC, stabilizeFrameworkErrorBody } from './stabilize.ts';

const response = (body: RecordedResponse['body']): RecordedResponse => ({ status: 415, headers: {}, body });

const springErrorBody = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  timestamp: '2026-08-09T13:24:55.123+00:00',
  path: '/pets/abc',
  status: 415,
  error: 'Unsupported Media Type',
  requestId: 'a1b2c3d4',
  ...over,
});

/**
 * A normalizer's whole job is to make a difference stop being reported, which in a tier where an absent
 * artifact means "this case conforms" makes it the most dangerous function in the directory. So these
 * tests are mostly adversarial: they establish what it must NOT touch, not what it does.
 */
describe('stabilizeFrameworkErrorBody', () => {
  it('substitutes the two varying fields of a real Spring error body', () => {
    const stabilized = stabilizeFrameworkErrorBody(response({ kind: 'json', value: springErrorBody() }));

    expect(stabilized.body).toEqual({
      kind: 'json',
      value: {
        timestamp: NONDETERMINISTIC,
        path: '/pets/abc',
        status: 415,
        error: 'Unsupported Media Type',
        requestId: NONDETERMINISTIC,
      },
    });
  });

  // The status is the deviation this case exists to record. Rewriting it would delete the finding.
  it('leaves status, headers, path and error untouched', () => {
    const original = response({ kind: 'json', value: springErrorBody() });
    const stabilized = stabilizeFrameworkErrorBody({ ...original, headers: { 'content-type': 'application/json' } });

    expect(stabilized.status).toBe(415);
    expect(stabilized.headers).toEqual({ 'content-type': 'application/json' });
  });

  // Two Spring errors that differ in a field the generator controls must stay distinguishable, or the
  // artifact stops describing which failure happened.
  it('keeps two different Spring errors distinguishable', () => {
    const a = stabilizeFrameworkErrorBody(response({ kind: 'json', value: springErrorBody() }));
    const b = stabilizeFrameworkErrorBody(
      response({ kind: 'json', value: springErrorBody({ status: 500, error: 'Internal Server Error' }) }),
    );

    expect(a.body).not.toEqual(b.body);
  });

  it('substitutes a value rather than removing the key, so the artifact shows normalization happened', () => {
    const stabilized = stabilizeFrameworkErrorBody(response({ kind: 'json', value: springErrorBody() }));
    const value = (stabilized.body as { value: Record<string, unknown> }).value;

    expect(Object.keys(value).sort()).toEqual(['error', 'path', 'requestId', 'status', 'timestamp']);
  });

  describe('does not fire on a body the generated code could have produced', () => {
    it('a delegate body that merely has a timestamp', () => {
      const body = { kind: 'json', value: { timestamp: '2026-08-09T00:00:00Z', id: 'abc' } } as const;

      expect(stabilizeFrameworkErrorBody(response(body)).body).toEqual(body);
    });

    it('a body with only two of the five attributes', () => {
      const body = { kind: 'json', value: { timestamp: 'x', requestId: 'y' } } as const;

      expect(stabilizeFrameworkErrorBody(response(body)).body).toEqual(body);
    });

    // The guard checks own properties of the *top-level* object only. A nested match must not fire, or a
    // generated model containing an error-shaped sub-object would have real values replaced.
    it('a nested object carrying all five attributes', () => {
      const body = { kind: 'json', value: { detail: springErrorBody() } } as const;

      expect(stabilizeFrameworkErrorBody(response(body)).body).toEqual(body);
    });

    it('an array whose element carries all five attributes', () => {
      const body = { kind: 'json', value: [springErrorBody()] } as const;

      expect(stabilizeFrameworkErrorBody(response(body)).body).toEqual(body);
    });

    it('a text body quoting all five attribute names', () => {
      const body = { kind: 'text', value: 'MISMATCH timestamp path status error requestId' } as const;

      expect(stabilizeFrameworkErrorBody(response(body)).body).toEqual(body);
    });

    it('a null json body', () => {
      const body = { kind: 'json', value: null } as const;

      expect(stabilizeFrameworkErrorBody(response(body)).body).toEqual(body);
    });

    it('a bodyless response', () => {
      expect(stabilizeFrameworkErrorBody(response({ kind: 'none' })).body).toEqual({ kind: 'none' });
    });
  });

  // `Object.hasOwn` rather than `in`: with `in`, a key explicitly set to `undefined` counts as present, so
  // the substitution would *add* `timestamp` and `requestId` to a body that never carried them.
  it('does not fire on keys whose values are undefined', () => {
    const value: Record<string, unknown> = {
      timestamp: undefined,
      path: undefined,
      status: undefined,
      error: undefined,
      requestId: undefined,
    };
    for (const name of Object.keys(value)) delete value[name];
    Object.setPrototypeOf(value, { timestamp: 'x', path: 'x', status: 'x', error: 'x', requestId: 'x' });

    expect(stabilizeFrameworkErrorBody(response({ kind: 'json', value })).body).toEqual({ kind: 'json', value });
  });

  it('does not mutate its argument', () => {
    const value = springErrorBody();
    stabilizeFrameworkErrorBody(response({ kind: 'json', value }));

    expect(value.timestamp).toBe('2026-08-09T13:24:55.123+00:00');
  });

  /**
   * The guard's premise, asserted rather than assumed: it is safe only while no case in the table declares
   * a response body carrying all five attribute names. If that ever changes, this fails here — in a
   * millisecond, with a clear reason — instead of silently replacing real values inside a committed
   * artifact six minutes into a container run.
   */
  it('is safe for every response body the case table actually declares', async () => {
    const { cases } = await import('../../cases/cases.ts');

    for (const apiCase of cases) {
      if (apiCase.response.body === undefined) continue;
      const body = { kind: 'json', value: apiCase.response.body } as const;

      expect(stabilizeFrameworkErrorBody(response(body)).body, `case ${apiCase.id} would be normalized`)
        .toEqual(body);
    }
  });
});
