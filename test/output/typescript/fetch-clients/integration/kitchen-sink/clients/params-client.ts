import { UrlBuilder } from '../utils/fetch-client.utils';

import type { FetchClientOptions, TypedResponse } from '../utils/fetch-client.utils';

export const PARAMS_CLIENT_DEFAULT_OPTIONS: FetchClientOptions = {};

export class ParamsClient {
  /**
   * Options for the fetch client.
   */
  public options: FetchClientOptions;

  constructor(options?: Partial<FetchClientOptions>) {
    this.options = { ...PARAMS_CLIENT_DEFAULT_OPTIONS, ...options };
  }

  /**
   * @param params Parameters for the endpoint.
   */
  public allLocations(params: {
      pathParam: string;
      queryParam?: string;
      xHeaderParam?: string;
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/locations/{pathParam}')
      .withPathParam('pathParam', params.pathParam)
      .withQueryParam('queryParam', params.queryParam)
      .build();
    const headers = { ...this.options.headers };
    if (params && params.xHeaderParam !== undefined) {
      headers['X-Header-Param'] = String(params.xHeaderParam);
    }
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: true });
    return response as unknown as Promise<TypedResponse<void>>;
  }

  /**
   * @param params Parameters for the endpoint.
   */
  public styleMatrix(params: {
      formExploded?: (string)[];
      formUnexploded?: (string)[];
      spaceDelimited?: (string)[];
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/styles')
      .withQueryParam('formExploded', params.formExploded)
      .withQueryParam('formUnexploded', params.formUnexploded)
      .withQueryParam('spaceDelimited', params.spaceDelimited)
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: true });
    return response as unknown as Promise<TypedResponse<void>>;
  }

  /**
   * @param params Parameters for the endpoint.
   */
  public pathStyleSimple(params: {
      values: (string)[];
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/styles/{values}')
      .withPathParam('values', params.values)
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: true });
    return response as unknown as Promise<TypedResponse<void>>;
  }

  /**
   * @param params Parameters for the endpoint.
   */
  public getEncoded(params: {
      value: string;
      raw?: string;
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/encoded/{value}')
      .withPathParam('value', params.value)
      .withQueryParam('raw', params.raw)
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: true });
    return response as unknown as Promise<TypedResponse<void>>;
  }
}
