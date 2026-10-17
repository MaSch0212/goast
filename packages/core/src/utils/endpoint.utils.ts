import type { ApiEndpoint } from '../transform/api-types.ts';

/**
 * Builds a preview of the URL of an endpoint that shows its query parameters as templates. Required query parameters
 * are written as `name={name}` and optional ones as `[name={name}]`. The path is kept as written in the spec, so path
 * parameters keep their `{name}` placeholders.
 * @param endpoint The endpoint to build the URL preview for.
 * @returns The endpoint path, followed by `?` and the query templates joined with `&` if there are query parameters.
 * @example
 * ```ts
 * // For GET /pets with a required `limit` and an optional `offset` query parameter:
 * getEndpointUrlPreview(endpoint); // '/pets?limit={limit}&[offset={offset}]'
 * ```
 */
export function getEndpointUrlPreview(endpoint: ApiEndpoint): string {
  let url = endpoint.path;
  const queryParams = endpoint.parameters.filter((p) => p.target === 'query');
  if (queryParams.length > 0) {
    url += '?' + queryParams.map((p) => (p.required ? `${p.name}={${p.name}}` : `[${p.name}={${p.name}}]`)).join('&');
  }
  return url;
}
