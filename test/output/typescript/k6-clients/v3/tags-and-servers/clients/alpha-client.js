// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { OneTagApiResponse, SharedTagApiResponse, TwoTagsApiResponse } from '../models/responses/alpha-responses';
 */

const ONE_TAG_PATH = '/one-tag';
const TWO_TAGS_PATH = '/two-tags';
const SHARED_TAG_PATH = '/shared-tag';

/**
 * The Alpha tag.
 *
 * @property {string} rootUrl The root URL for this client.
 */
export class AlphaClient {
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
   * @returns {Promise<OneTagApiResponse>}
   */
  async oneTag(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, ONE_TAG_PATH, 'get');

    return /** @type {OneTagApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<TwoTagsApiResponse>}
   */
  async twoTags(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, TWO_TAGS_PATH, 'get');

    return /** @type {TwoTagsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<SharedTagApiResponse>}
   */
  async sharedTag(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, SHARED_TAG_PATH, 'get');

    return /** @type {SharedTagApiResponse} */ (
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
