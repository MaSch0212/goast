import { UrlBuilder } from '../utils/fetch-client.utils';

import type { FetchClientOptions, TypedResponse } from '../utils/fetch-client.utils';

export const PARAMETERS_CLIENT_DEFAULT_OPTIONS: FetchClientOptions = {};

export class ParametersClient {
  /**
   * Options for the fetch client.
   */
  public options: FetchClientOptions;

  constructor(options?: Partial<FetchClientOptions>) {
    this.options = { ...PARAMETERS_CLIENT_DEFAULT_OPTIONS, ...options };
  }

  public bodyParam(): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/body')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'POST',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: true });
    return response as unknown as Promise<TypedResponse<void>>;
  }

  public formDataParams(): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/form')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'POST',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: true });
    return response as unknown as Promise<TypedResponse<void>>;
  }

  public fileUpload(): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/upload')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'POST',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: true });
    return response as unknown as Promise<TypedResponse<void>>;
  }

  /**
   * @param params Parameters for the endpoint.
   */
  public queryParams(params: {
      tags?: unknown;
      ids?: unknown;
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/query')
      .withQueryParam('tags', params.tags)
      .withQueryParam('ids', params.ids)
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
