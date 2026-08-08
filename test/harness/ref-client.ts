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
 * Issues one case's declared request against `baseUrl`, exactly as written.
 *
 * The path is concatenated rather than passed through `URL`'s path handling, because
 * `expectRequest.path` is already encoded and re-encoding it would silently repair the very defect a
 * generated client is being measured for.
 */
export async function issueCase(baseUrl: string, apiCase: ApiCase): Promise<Response> {
  const { path, query, headers, body } = apiCase.expectRequest;

  // `URLSearchParams.toString()` renders a space as `+`, where OpenAPI's `spaceDelimited` style
  // specifies `%20`. Harmless here because `diffRequest` compares the query as a decoded multi-map
  // (`parseQuery` decodes both `+` and `%20` back to a literal space), never as raw wire bytes — but it
  // is a real spot where "the right bytes on the wire" is not what this oracle actually checks.
  const search = new URLSearchParams();
  for (const [key, values] of Object.entries(query ?? {})) for (const value of values) search.append(key, value);
  const queryString = search.toString();

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
