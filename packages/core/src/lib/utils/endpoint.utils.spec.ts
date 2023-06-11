import { getEndpointUrlPreview } from './endpoint.utils';
import { ApiEndpoint } from '../transform';

describe('getEndpointUrlPreview', () => {
  it('should return the endpoint path if there are no query parameters', () => {
    const endpoint = { path: '/foo', parameters: [] } as unknown as ApiEndpoint;
    expect(getEndpointUrlPreview(endpoint)).toBe('/foo');
  });

  it('should append query parameters to the endpoint path', () => {
    const endpoint = {
      path: '/foo',
      parameters: [
        { name: 'bar', target: 'query', required: true },
        { name: 'baz', target: 'query', required: false },
      ],
    } as unknown as ApiEndpoint;
    expect(getEndpointUrlPreview(endpoint)).toBe('/foo?bar={bar}&[baz={baz}]');
  });

  it('should handle multiple query parameters', () => {
    const endpoint = {
      path: '/foo',
      parameters: [
        { name: 'bar', target: 'query', required: true },
        { name: 'baz', target: 'query', required: false },
        { name: 'qux', target: 'query', required: true },
      ],
    } as unknown as ApiEndpoint;
    expect(getEndpointUrlPreview(endpoint)).toBe('/foo?bar={bar}&[baz={baz}]&qux={qux}');
  });
});
