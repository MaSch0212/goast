// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { TagWithSpaceApiResponse } from '../models/responses/tag-with-space-responses';
 */

const TAG_WITH_SPACE_PATH = '/tag-with-space';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class TagWithSpaceClient {
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
   * @param {Params} [k6Params]
   * @returns {Promise<TagWithSpaceApiResponse>}
   */
  async tagWithSpace(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, TAG_WITH_SPACE_PATH, 'get');

    return /** @type {TagWithSpaceApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
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
