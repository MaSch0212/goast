import { describe, expect, it } from 'vitest';

import { render } from './endpoint.test-utils.ts';
import { buildApiRequestSupportClass } from './support-classes.ts';

describe('buildApiRequestSupportClass', () => {
  const code = render(buildApiRequestSupportClass().declaration);

  it('detects a request body through the body detection feature, which also knows streamed HTTP/2 bodies', () => {
    expect(code).toContain('IHttpRequestBodyDetectionFeature>()?.CanHaveBody');
  });

  it('falls back to the content length and transfer encoding where the feature is absent', () => {
    expect(code).toContain(
      '?? (request.ContentLength > 0 || request.Headers.ContainsKey(HeaderNames.TransferEncoding))',
    );
  });
});
