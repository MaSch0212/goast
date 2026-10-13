// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { OpServerApiResponse, PathServerApiResponse, UntaggedApiResponse } from '../models/responses/service-2-responses';
 */

const UNTAGGED_PATH = '/untagged';
const PATH_SERVER_PATH = '/path-server';
const OP_SERVER_PATH = '/op-server';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class Service2Client {
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
   * @returns {Promise<UntaggedApiResponse>}
   */
  async untagged(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, UNTAGGED_PATH, 'get');

    return /** @type {UntaggedApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<PathServerApiResponse>}
   */
  async pathServer(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, PATH_SERVER_PATH, 'get');

    return /** @type {PathServerApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<OpServerApiResponse>}
   */
  async opServer(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, OP_SERVER_PATH, 'get');

    return /** @type {OpServerApiResponse} */ (
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
