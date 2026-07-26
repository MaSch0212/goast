// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { ListThingsApiResponse } from '../models/responses/service-1-responses';
 */

const LIST_THINGS_PATH = '/things';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class Service1Client {
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
   * @returns {Promise<ListThingsApiResponse>}
   */
  async listThings(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, LIST_THINGS_PATH, 'get');

    return /** @type {ListThingsApiResponse} */ (
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
