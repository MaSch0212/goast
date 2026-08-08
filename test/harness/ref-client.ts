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

  const search = new URLSearchParams();
  for (const [key, values] of Object.entries(query ?? {})) for (const value of values) search.append(key, value);
  const queryString = search.toString();

  const built = buildBody(body);
  const requestHeaders = new Headers(headers ?? {});
  if (built.contentType !== undefined) requestHeaders.set('content-type', built.contentType);

  return await fetch(`${baseUrl}${path}${queryString === '' ? '' : `?${queryString}`}`, {
    method: apiCase.method.toUpperCase(),
    headers: requestHeaders,
    body: built.body,
  });
}
