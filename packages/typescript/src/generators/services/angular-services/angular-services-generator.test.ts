import { describe, expect, it } from 'vitest';

import { TypeScriptAngularServicesGenerator } from './angular-services-generator.ts';

class TestableGenerator extends TypeScriptAngularServicesGenerator {
  public callGetRootUrl(ctx: any): string {
    return (this as any).getRootUrl(ctx);
  }
}

describe('TypeScriptAngularServicesGenerator', () => {
  describe('getRootUrl', () => {
    const generator = () => new TestableGenerator();

    it('falls back to "/" for a spec with no services', () => {
      const ctx = { data: { services: [] }, config: { rootUrl: undefined } };
      expect(generator().callGetRootUrl(ctx)).toBe('/');
    });

    it('falls back to "/" for a service with neither $src nor endpoints', () => {
      const ctx = { data: { services: [{ endpoints: [] }] }, config: { rootUrl: undefined } };
      expect(generator().callGetRootUrl(ctx)).toBe('/');
    });

    it("uses the document's first server url when present", () => {
      const ctx = {
        data: { services: [{ $src: { document: { servers: [{ url: 'https://api.example.com' }] } } }] },
        config: { rootUrl: undefined },
      };
      expect(generator().callGetRootUrl(ctx)).toBe('https://api.example.com');
    });

    it("falls back to the first endpoint's document when the service has no $src", () => {
      const ctx = {
        data: {
          services: [{ endpoints: [{ $src: { document: { servers: [{ url: '/api' }] } } }] }],
        },
        config: { rootUrl: undefined },
      };
      expect(generator().callGetRootUrl(ctx)).toBe('/api');
    });
  });
});
