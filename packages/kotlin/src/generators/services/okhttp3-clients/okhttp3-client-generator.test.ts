import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { DefaultKotlinOkHttp3Generator } from './okhttp3-client-generator.ts';

class TestGenerator extends DefaultKotlinOkHttp3Generator {
  public delegateArguments(serializerAsParameter: boolean): string[] {
    return this.getClientDelegateArguments(serializerAsParameter);
  }
}

describe('DefaultKotlinOkHttp3Generator', () => {
  // The generated `ApiClient` base takes `(baseUrl, objectMapper, client)` under `serializer: 'parameter'`
  // and `(baseUrl, client, objectMapper)` otherwise (okhttp3-clients-generator.ts:129-131). Defect 27 hard-
  // coded the first order for both, so the default `'static'` config passed `objectMapper` into the
  // `Call.Factory` slot and vice versa — 76 diagnostics across 32 units, always as a symmetric pair.
  describe('getClientDelegateArguments', () => {
    it('matches the base order when the serializer is a constructor parameter', () => {
      expect(new TestGenerator().delegateArguments(true)).toEqual(['basePath', 'objectMapper', 'client']);
    });

    it('matches the base order when the serializer is static', () => {
      expect(new TestGenerator().delegateArguments(false)).toEqual(['basePath', 'client', 'objectMapper']);
    });
  });
});
