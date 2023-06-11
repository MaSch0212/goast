import { ApiEndpoint } from '../transform';

export function getEndpointUrlPreview(endpoint: ApiEndpoint): string {
  let url = endpoint.path;
  const queryParams = endpoint.parameters.filter((p) => p.target === 'query');
  if (queryParams.length > 0) {
    url += '?' + queryParams.map((p) => (p.required ? `${p.name}={${p.name}}` : `[${p.name}={${p.name}}]`)).join('&');
  }
  return url;
}
