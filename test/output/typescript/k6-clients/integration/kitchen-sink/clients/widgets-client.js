// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { GetWidgetApiResponse } from '../models/responses/widgets-responses';
 */

/**
 * Parameters for operation getWidget
 *
 * @typedef GetWidgetParams
 * @property {string} id
 */

const GET_WIDGET_PATH = '/widgets/{id}';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class WidgetsClient {
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
   * @param {GetWidgetParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<GetWidgetApiResponse>}
   */
  async getWidget(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, GET_WIDGET_PATH, 'get');
    rb.path('id', params.id, {});

    return /** @type {GetWidgetApiResponse} */ (
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
