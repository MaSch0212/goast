import { UrlBuilder } from '../utils/fetch-client.utils';

import type { FetchClientOptions, TypedResponse } from '../utils/fetch-client.utils';

export const INHERITANCE_CLIENT_DEFAULT_OPTIONS: FetchClientOptions = {};

export class InheritanceClient {
  /**
   * Options for the fetch client.
   */
  public options: FetchClientOptions;

  constructor(options?: Partial<FetchClientOptions>) {
    this.options = { ...INHERITANCE_CLIENT_DEFAULT_OPTIONS, ...options };
  }

  /**
   * @param params Parameters for the endpoint.
   */
  public inheritsParams(params: {
      id: string;
      common?: string;
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/inherited/{id}')
      .withPathParam('id', params.id)
      .withQueryParam('common', params.common)
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
  public inheritsAndAdds(params: {
      id: string;
      common?: string;
      extra?: string;
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/inherited/{id}')
      .withPathParam('id', params.id)
      .withQueryParam('common', params.common)
      .withQueryParam('extra', params.extra)
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
  public overridesParam(params: {
      id: string;
      common?: number;
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/overridden/{id}')
      .withPathParam('id', params.id)
      .withQueryParam('common', params.common)
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
  public refParam(params: {
      id: string;
      page?: number;
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/ref-param/{id}')
      .withPathParam('id', params.id)
      .withQueryParam('page', params.page)
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
