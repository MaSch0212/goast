import { UrlBuilder } from '../utils/fetch-client.utils';

import type { BlobRef } from '../models/blob-ref';
import type { FetchClientOptions, TypedResponse } from '../utils/fetch-client.utils';

export const BLOBS_CLIENT_DEFAULT_OPTIONS: FetchClientOptions = {};

export class BlobsClient {
  /**
   * Options for the fetch client.
   */
  public options: FetchClientOptions;

  constructor(options?: Partial<FetchClientOptions>) {
    this.options = { ...BLOBS_CLIENT_DEFAULT_OPTIONS, ...options };
  }

  /**
   * @param body Body for the endpoint.
   */
  public uploadBlob(body: Blob): Promise<TypedResponse<BlobRef>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/blobs')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<BlobRef>>;
  }
}
