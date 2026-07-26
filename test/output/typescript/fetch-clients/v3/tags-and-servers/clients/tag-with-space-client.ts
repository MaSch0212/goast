import { UrlBuilder } from '../utils/fetch-client.utils';

import type { FetchClientOptions, TypedResponse } from '../utils/fetch-client.utils';

export const TAG_WITH_SPACE_CLIENT_DEFAULT_OPTIONS: FetchClientOptions = {
  baseUrl: 'https://api.example.com/v1',
};

export class TagWithSpaceClient {
  /**
   * Options for the fetch client.
   */
  public options: FetchClientOptions;

  constructor(options?: Partial<FetchClientOptions>) {
    this.options = { ...TAG_WITH_SPACE_CLIENT_DEFAULT_OPTIONS, ...options };
  }

  public tagWithSpace(): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/tag-with-space')
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
