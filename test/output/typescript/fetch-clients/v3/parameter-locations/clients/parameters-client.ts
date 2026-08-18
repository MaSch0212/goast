import { UrlBuilder } from '../utils/fetch-client.utils';

import type { ParamSchema } from '../models/param-schema';
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

  /**
   * @param params Parameters for the endpoint.
   */
  public twoPathParams(params: {
      id: string;
      sub: number;
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/path/{id}/{sub}')
      .withPathParam('id', params.id)
      .withPathParam('sub', params.sub)
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
  public queryParams(params: {
      requiredString: string;
      optionalString?: string;
      intWithDefault?: number;
      flag?: boolean;
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/query')
      .withQueryParam('requiredString', params.requiredString)
      .withQueryParam('optionalString', params.optionalString)
      .withQueryParam('intWithDefault', params.intWithDefault)
      .withQueryParam('flag', params.flag)
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
  public headerParams(params: {
      xRequestId: string;
      xOptionalHeader?: string;
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/header')
      .build();
    const headers = { ...this.options.headers };
    if (params && params.xRequestId !== undefined) {
      headers['X-Request-Id'] = String(params.xRequestId);
    }
    if (params && params.xOptionalHeader !== undefined) {
      headers['X-Optional-Header'] = String(params.xOptionalHeader);
    }
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: true });
    return response as unknown as Promise<TypedResponse<void>>;
  }

  public cookieParams(): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/cookie')
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
  public mixedParams(params: {
      id: string;
      filter?: string;
      xTraceId?: string;
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/mixed/{id}')
      .withPathParam('id', params.id)
      .withQueryParam('filter', params.filter)
      .build();
    const headers = { ...this.options.headers };
    if (params && params.xTraceId !== undefined) {
      headers['X-Trace-Id'] = String(params.xTraceId);
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
  public describedParams(params: {
      withDescription?: string;
      withoutDescription?: string;
      withExample?: string;
      withRefSchema?: ParamSchema;
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/described')
      .withQueryParam('withDescription', params.withDescription)
      .withQueryParam('withoutDescription', params.withoutDescription)
      .withQueryParam('withExample', params.withExample)
      .withQueryParam('withRefSchema', params.withRefSchema)
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
  public allowEmptyValueParam(params: {
      search?: string;
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/empty-value')
      .withQueryParam('search', params.search)
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
  public reservedCharParam(params: {
      filter?: string;
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/reserved')
      .withQueryParam('filter', params.filter)
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
