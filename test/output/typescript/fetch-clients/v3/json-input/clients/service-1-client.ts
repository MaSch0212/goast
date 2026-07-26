import { UrlBuilder } from '../utils/fetch-client.utils';

import type { Thing } from '../models/thing';
import type { FetchClientOptions, TypedResponse } from '../utils/fetch-client.utils';

export const SERVICE_1_CLIENT_DEFAULT_OPTIONS: FetchClientOptions = {};

export class Service1Client {
  /**
   * Options for the fetch client.
   */
  public options: FetchClientOptions;

  constructor(options?: Partial<FetchClientOptions>) {
    this.options = { ...SERVICE_1_CLIENT_DEFAULT_OPTIONS, ...options };
  }

  public listThings(): Promise<TypedResponse<(Thing)[]>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/things')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<(Thing)[]>>;
  }
}
