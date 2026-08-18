import { UrlBuilder } from '../utils/fetch-client.utils';

import type { Thing } from '../models/thing';
import type { FetchClientOptions, TypedResponse } from '../utils/fetch-client.utils';

export const RESPONSES_CLIENT_DEFAULT_OPTIONS: FetchClientOptions = {};

export class ResponsesClient {
  /**
   * Options for the fetch client.
   */
  public options: FetchClientOptions;

  constructor(options?: Partial<FetchClientOptions>) {
    this.options = { ...RESPONSES_CLIENT_DEFAULT_OPTIONS, ...options };
  }

  public twoSuccessCodes(): Promise<TypedResponse<Thing>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/two-success')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<Thing>>;
  }

  public successAndDefault(): Promise<TypedResponse<Thing>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/default')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<Thing>>;
  }

  public onlyDefault(): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/only-default')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: true });
    return response as unknown as Promise<TypedResponse<void>>;
  }

  public noContent(): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/no-content')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: true });
    return response as unknown as Promise<TypedResponse<void>>;
  }

  public emptyBody200(): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/empty-200')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: true });
    return response as unknown as Promise<TypedResponse<void>>;
  }

  public rangeCodes(): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/ranges')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: true });
    return response as unknown as Promise<TypedResponse<void>>;
  }

  public mixedExactAndRange(): Promise<TypedResponse<Thing>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/mixed-codes')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<Thing>>;
  }

  public errorCodes(): Promise<TypedResponse<Thing>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/errors')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<Thing>>;
  }

  public multiContentResponse(): Promise<TypedResponse<Thing>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/multi-content')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<Thing>>;
  }

  public primitiveResponse(): Promise<TypedResponse<string>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/primitive')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<string>>;
  }

  public arrayResponse(): Promise<TypedResponse<(Thing)[]>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/array')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<(Thing)[]>>;
  }

  public refResponse(): Promise<TypedResponse<Thing>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/ref-response')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<Thing>>;
  }
}
