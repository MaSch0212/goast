import type { ApiCase, BodyExpectation } from '../cases/types.ts';

/**
 * Builds the request body a case declares.
 *
 * Deliberately dumb and generator-independent: this is the oracle, so it shares no code with any
 * generator. If it grew a URL builder or a serializer it would start making the same mistakes it
 * exists to detect.
 */
function buildBody(body: BodyExpectation | undefined): { body: BodyInit | null; contentType?: string } {
  if (body === undefined || body.kind === 'none') return { body: null };
  if (body.kind === 'json') return { body: JSON.stringify(body.value), contentType: 'application/json' };
  if (body.kind === 'text') return { body: body.value, contentType: 'text/plain' };
  if (body.kind === 'form') {
    const params = new URLSearchParams();
    for (const [key, values] of Object.entries(body.fields)) for (const value of values) params.append(key, value);
    return { body: params.toString(), contentType: 'application/x-www-form-urlencoded' };
  }
  if (body.kind === 'multipart') {
    const form = new FormData();
    for (const part of body.parts) {
      if (part.filename === undefined) form.append(part.name, part.value);
      else form.append(part.name, new File([part.value], part.filename, { type: part.contentType }), part.filename);
    }
    // No explicit content-type: `fetch` must set it, because only it knows the boundary.
    return { body: form };
  }
  const binary = Uint8Array.from(atob(body.base64), (c) => c.charCodeAt(0));
  return { body: binary, contentType: 'application/octet-stream' };
}

/**
 * Percent-encodes one query key or value the way the OpenAPI query styles in the case table require.
 *
 * `encodeURIComponent` minus the comma. Two rules make that exactly right, and `URLSearchParams` — which
 * this replaced — gets both wrong:
 *
 *   * **A comma stays literal.** `style: form, explode: false` emits a comma-joined value (`a,b`), and a
 *     comma is a legal sub-delimiter in a query string, so it belongs on the wire as itself.
 *     `URLSearchParams` renders it `%2C`.
 *   * **A space is `%20`, never `+`.** `style: spaceDelimited` specifies percent-encoding; `+` is
 *     *form* encoding, a different thing that only `application/x-www-form-urlencoded` readers undo.
 *     `URLSearchParams` renders it `+`.
 *
 * Neither mattered while this oracle only drove generated *clients*: there `issueCase` is not the sender,
 * and `diffRequest` compares a decoded multi-map (`parseQuery` decodes `+` and `%2C` right back). In the
 * **server** direction `issueCase` *is* the sender and the code under test parses the raw wire, so the
 * bytes are the measurement. Measured against `easy-network-stub`: it never percent-decodes a query value
 * (`?spaceDelimited=a%20b` arrives as `['a%20b']`) and its query matcher's character class excludes both
 * `,` and `+` — so under the old encoder two of that leg's artifacts would have been describing this
 * function rather than the generated code.
 *
 * The `%2C` substitution cannot corrupt anything else: every `%` in `encodeURIComponent` output starts a
 * complete two-hex-digit triple (a literal `%` in the input becomes `%25`), so the substring `%2C` can
 * only ever be an encoded comma.
 */
export function encodeQueryComponent(value: string): string {
  return encodeURIComponent(value).replaceAll('%2C', ',');
}

/**
 * Renders a case's declared query multi-map as the query string to put on the wire.
 *
 * Repeated keys in declaration order, `&`-joined, both halves of each pair through
 * {@link encodeQueryComponent}. Returns `''` for an absent or empty query, which the caller uses to decide
 * whether to append a `?` at all — an empty `?` is a different request than none.
 */
export function buildQueryString(query: Record<string, string[]> | undefined): string {
  const pairs: string[] = [];
  for (const [key, values] of Object.entries(query ?? {})) {
    for (const value of values) pairs.push(`${encodeQueryComponent(key)}=${encodeQueryComponent(value)}`);
  }
  return pairs.join('&');
}

/**
 * Renders a failed `fetch` as a deterministic one-line description, for a server-direction leg to commit.
 *
 * Two problems this solves, both measured.
 *
 * `error.message` alone is `fetch failed` — Deno puts the text that says *what* failed one level down in
 * `cause`. A leg recording only the message commits an artifact that distinguishes nothing: a server the
 * code under test deliberately made destroy the socket, a server that was never listening, and a request
 * that timed out all read identically. In a tier where an absent artifact means "this case conforms",
 * that is the difference between recording a generator defect and recording the harness's own failure.
 *
 * The cause text is not committable as-is, though: it interpolates the request URL *and* the client's
 * ephemeral source port —
 * `error sending request from 127.0.0.1:62673 for http://127.0.0.1:62661/styles/a,b (127.0.0.1:62661)` —
 * so an artifact carrying it verbatim would churn on every run. Every `:<digits>` is replaced, which is
 * the only nondeterminism observed across repeated runs.
 */
export function describeTransportFailure(error: unknown): string {
  const messages: string[] = [];
  let current: unknown = error;
  while (current instanceof Error) {
    messages.push(current.message);
    current = current.cause;
  }
  if (messages.length === 0) return String(error).replaceAll(/:\d+/g, ':<port>');
  return messages.join(' <- ').replaceAll(/:\d+/g, ':<port>');
}

/**
 * Issues one case's declared request against `baseUrl`, exactly as written.
 *
 * The path is concatenated rather than passed through `URL`'s path handling, because
 * `expectRequest.path` is already encoded and re-encoding it would silently repair the very defect a
 * generated client is being measured for. The query gets the same treatment for the same reason, via
 * {@link buildQueryString}.
 */
export async function issueCase(baseUrl: string, apiCase: ApiCase): Promise<Response> {
  const { path, query, headers, body } = apiCase.expectRequest;

  const queryString = buildQueryString(query);

  const built = buildBody(body);
  const requestHeaders = new Headers(headers ?? {});
  // A case-declared content-type wins: setting the body-kind default unconditionally would make a
  // declared content-type self-fulfilling, and the table would have no way to express one that
  // differs from the body kind's default.
  if (built.contentType !== undefined && !requestHeaders.has('content-type')) {
    requestHeaders.set('content-type', built.contentType);
  }

  return await fetch(`${baseUrl}${path}${queryString === '' ? '' : `?${queryString}`}`, {
    method: apiCase.method.toUpperCase(),
    headers: requestHeaders,
    body: built.body,
  });
}
