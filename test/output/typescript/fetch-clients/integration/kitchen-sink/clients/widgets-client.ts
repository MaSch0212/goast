import { UrlBuilder } from '../utils/fetch-client.utils';

import type { Widget } from '../models/widget';
import type { FetchClientOptions, TypedResponse } from '../utils/fetch-client.utils';

export const WIDGETS_CLIENT_DEFAULT_OPTIONS: FetchClientOptions = {};

export class WidgetsClient {
  /**
   * Options for the fetch client.
   */
  public options: FetchClientOptions;

  constructor(options?: Partial<FetchClientOptions>) {
    this.options = { ...WIDGETS_CLIENT_DEFAULT_OPTIONS, ...options };
  }

  /**
   * @param params Parameters for the endpoint.
   */
  public getWidget(params: {
      id: string;
    }): Promise<TypedResponse<Widget>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/widgets/{id}')
      .withPathParam('id', params.id)
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<Widget>>;
  }
}
