// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { UploadBlobApiResponse } from '../models/responses/blobs-responses';
 */

/**
 * Parameters for operation uploadBlob
 *
 * @typedef UploadBlobParams
 * @property {Blob} body
 */

const UPLOAD_BLOB_PATH = '/blobs';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class BlobsClient {
  /**
   * Creates a new instance of the client.
   *
   * @param {string} rootUrl The root URL for this client.
   * @param {() => Params} [defaultK6ParamsFactory] A factory function that returns the default K6 parameters.
   */
  constructor(rootUrl, defaultK6ParamsFactory) {
    this.rootUrl = rootUrl;
    this._defaultK6ParamsFactory = defaultK6ParamsFactory;
  }

  /**
   * @param {UploadBlobParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<UploadBlobApiResponse>}
   */
  async uploadBlob(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, UPLOAD_BLOB_PATH, 'post');
    rb.body(params.body, 'application/octet-stream');

    return /** @type {UploadBlobApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @private
   * @param {Params} [k6Params]
   */
  getK6Params(k6Params) {
    return Object.assign({}, this._defaultK6ParamsFactory ? this._defaultK6ParamsFactory() : {}, k6Params);
  }
}
