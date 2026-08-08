import type { ApiCase, RecordedBody, RecordedRequest } from '../cases/types.ts';

/**
 * Headers the comparison drops.
 *
 * These are set by the runtime, not by the generated client, so asserting them would make the tier
 * fail on a Deno upgrade rather than on a generator change. Everything else survives, because a
 * header the generator *does* control is exactly what tier 4 is for.
 */
export const IGNORED_HEADERS: ReadonlySet<string> = new Set([
  'host',
  'user-agent',
  'accept-encoding',
  'content-length',
  'connection',
]);

export type Deviation = { field: string; expected: string; actual: string };

export function normalizeHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, value] of headers) {
    const lower = name.toLowerCase();
    if (!IGNORED_HEADERS.has(lower)) result[lower] = value;
  }
  return result;
}

export function parseQuery(url: URL): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, value] of url.searchParams) (result[key] ??= []).push(value);
  return result;
}

export async function readBody(request: Request): Promise<RecordedBody> {
  const contentType = request.headers.get('content-type') ?? '';
  if (request.body === null) return { kind: 'none' };

  if (contentType.includes('application/json')) {
    const text = await request.text();
    if (text === '') return { kind: 'none' };
    return { kind: 'json', value: JSON.parse(text) };
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const fields: Record<string, string[]> = {};
    for (const [key, value] of new URLSearchParams(await request.text())) (fields[key] ??= []).push(value);
    return { kind: 'form', fields };
  }
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const parts = [];
    for (const [name, value] of form) {
      parts.push(
        value instanceof File
          ? { name, filename: value.name, contentType: value.type, value: await value.text() }
          : { name, value },
      );
    }
    return { kind: 'multipart', parts };
  }
  if (contentType.startsWith('text/')) return { kind: 'text', value: await request.text() };

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length === 0) return { kind: 'none' };
  return { kind: 'binary', base64: btoa(String.fromCharCode(...bytes)) };
}

/** Stable JSON, so an object's key order cannot make two equal values compare unequal. */
function stable(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'undefined';
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(',')}}`;
}

function compare(field: string, expected: unknown, actual: unknown, into: Deviation[]): void {
  const e = stable(expected);
  const a = stable(actual);
  if (e !== a) into.push({ field, expected: e, actual: a });
}

/**
 * Compares one recorded request against its expectation.
 *
 * Only what the expectation *mentions* is compared. A header the case does not name is not a
 * deviation: the case table declares the contract, and a runtime that adds `accept` is not a
 * generator defect. Query and body are compared whenever the expectation names them.
 */
export function diffRequest(expected: ApiCase['expectRequest'], actual: RecordedRequest): Deviation[] {
  const deviations: Deviation[] = [];

  if (expected.path !== actual.path) {
    deviations.push({ field: 'path', expected: expected.path, actual: actual.path });
  }

  if (expected.query !== undefined) {
    const keys = [...new Set([...Object.keys(expected.query), ...Object.keys(actual.query)])].sort();
    for (const key of keys) compare(`query.${key}`, expected.query[key], actual.query[key], deviations);
  }

  for (const [name, value] of Object.entries(expected.headers ?? {})) {
    const lower = name.toLowerCase();
    if (actual.headers[lower] !== value) {
      deviations.push({ field: `header.${lower}`, expected: value, actual: actual.headers[lower] ?? '<absent>' });
    }
  }

  if (expected.body !== undefined) compare('body', expected.body, actual.body, deviations);

  return deviations;
}

export function diffResult(expected: unknown, actual: unknown): Deviation[] {
  const deviations: Deviation[] = [];
  compare('result', expected, actual, deviations);
  return deviations;
}

export function formatDeviations(deviations: readonly Deviation[]): string {
  return deviations.map((d) => `${d.field}\n  expected ${d.expected}\n  actual   ${d.actual}\n`).join('');
}
