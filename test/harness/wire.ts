import type { ApiCase, RecordedBody, RecordedRequest, RecordedResponse } from '../cases/types.ts';

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

export async function readBody(source: Request | Response): Promise<RecordedBody> {
  const contentType = source.headers.get('content-type') ?? '';
  if (source.body === null) return { kind: 'none' };

  if (contentType.includes('application/json')) {
    const text = await source.text();
    if (text === '') return { kind: 'none' };
    return { kind: 'json', value: JSON.parse(text) };
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const fields: Record<string, string[]> = {};
    for (const [key, value] of new URLSearchParams(await source.text())) (fields[key] ??= []).push(value);
    return { kind: 'form', fields };
  }
  if (contentType.includes('multipart/form-data')) {
    const form = await source.formData();
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
  if (contentType.startsWith('text/')) return { kind: 'text', value: await source.text() };

  const bytes = new Uint8Array(await source.arrayBuffer());
  if (bytes.length === 0) return { kind: 'none' };
  return { kind: 'binary', base64: bytesToBase64(bytes) };
}

/**
 * Converts bytes to base64 in fixed-size chunks.
 *
 * `btoa(String.fromCharCode(...bytes))` spreads the whole buffer as call arguments, which stack-
 * overflows well before a realistic upload's size (harmless only for the current `"hello"` fixture).
 * Building the string in bounded chunks keeps memory use flat regardless of payload size.
 */
function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 8192;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
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
 * Headers are the one field compared only where the expectation *mentions* them: a header the case does
 * not name is not a deviation, because the runtime adds `accept`, `host`, `content-length` and friends
 * that no case declares, and a case-declared contract cannot punish a header it never asked about.
 *
 * Query and body have no such excuse — the runtime never invents a query parameter or a request body —
 * so both are compared unconditionally, defaulting an undeclared `expected.query` to `{}` and an
 * undeclared `expected.body` to `{ kind: 'none' }`. This is what lets this function see a parameter
 * emitted into the wrong location, or a body attached to a request the case declares none for; leaving
 * either comparison conditional on the expectation naming the field would make it blind to exactly that.
 */
export function diffRequest(expected: ApiCase['expectRequest'], actual: RecordedRequest): Deviation[] {
  const deviations: Deviation[] = [];

  if (expected.path !== actual.path) {
    deviations.push({ field: 'path', expected: expected.path, actual: actual.path });
  }

  const expectedQuery = expected.query ?? {};
  const queryKeys = [...new Set([...Object.keys(expectedQuery), ...Object.keys(actual.query)])].sort();
  for (const key of queryKeys) compare(`query.${key}`, expectedQuery[key], actual.query[key], deviations);

  for (const [name, value] of Object.entries(expected.headers ?? {})) {
    const lower = name.toLowerCase();
    if (actual.headers[lower] !== value) {
      deviations.push({ field: `header.${lower}`, expected: value, actual: actual.headers[lower] ?? '<absent>' });
    }
  }

  compare('body', expected.body ?? { kind: 'none' }, actual.body, deviations);

  return deviations;
}

/** Parses one response into the shape {@link diffResponse} compares. */
export async function readResponse(response: Response): Promise<RecordedResponse> {
  return {
    status: response.status,
    headers: normalizeHeaders(response.headers),
    body: await readBody(response),
  };
}

/**
 * Compares one recorded response against the case's declared `response`.
 *
 * The mirror of {@link diffRequest}, and it follows that function's rules deliberately: status and body
 * are compared unconditionally, headers only where the case declares them. The asymmetry has the same
 * justification in this direction — the runtime supplies `date`, `content-length` and
 * `transfer-encoding` that no case names, but it never invents a status or a response body.
 *
 * The case table types `response.body` as `unknown` rather than as a `BodyExpectation`, because a
 * declared response body is always JSON in this corpus (or absent). It is lifted into
 * `{ kind: 'json' }` here so that one `compare` call can put it beside a `RecordedBody` — which also
 * means a response that arrives as `text/plain` reports as a `kind` mismatch rather than as a silently
 * unequal value, and that is exactly how a delegate's plain-text failure report becomes readable in the
 * committed artifact.
 */
export function diffResponse(expected: ApiCase['response'], actual: RecordedResponse): Deviation[] {
  const deviations: Deviation[] = [];

  if (expected.status !== actual.status) {
    deviations.push({ field: 'status', expected: String(expected.status), actual: String(actual.status) });
  }

  for (const [name, value] of Object.entries(expected.headers ?? {})) {
    const lower = name.toLowerCase();
    if (actual.headers[lower] !== value) {
      deviations.push({ field: `header.${lower}`, expected: value, actual: actual.headers[lower] ?? '<absent>' });
    }
  }

  const expectedBody: RecordedBody = expected.body === undefined
    ? { kind: 'none' }
    : { kind: 'json', value: expected.body };
  compare('body', expectedBody, actual.body, deviations);

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
