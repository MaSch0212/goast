// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { DeprecatedOpApiResponse, DeprecatedOpNoDescApiResponse, DeprecatedParamsApiResponse } from '../models/responses/deprecation-responses';
 */

/**
 * Parameters for operation deprecatedParams
 *
 * @typedef DeprecatedParamsParams
 * @property {string} [withDesc] Deprecated: This parameter is deprecated.
 * @property {string} [noDesc] Deprecated:
 * @property {string} [plain]
 */

const DEPRECATED_OP_PATH = '/deprecated-op';
const DEPRECATED_OP_NO_DESC_PATH = '/deprecated-op-no-desc';
const DEPRECATED_PARAMS_PATH = '/deprecated-params';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class DeprecationClient {
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
   * This operation is deprecated.
   *
   * @param {Params} [k6Params]
   * @returns {Promise<DeprecatedOpApiResponse>}
   * @deprecated
   */
  async deprecatedOp(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, DEPRECATED_OP_PATH, 'get');

    return /** @type {DeprecatedOpApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<DeprecatedOpNoDescApiResponse>}
   * @deprecated
   */
  async deprecatedOpNoDesc(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, DEPRECATED_OP_NO_DESC_PATH, 'get');

    return /** @type {DeprecatedOpNoDescApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {DeprecatedParamsParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<DeprecatedParamsApiResponse>}
   */
  async deprecatedParams(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, DEPRECATED_PARAMS_PATH, 'get');
    if (params) {
      rb.query('withDesc', params.withDesc, {});
      rb.query('noDesc', params.noDesc, {});
      rb.query('plain', params.plain, {});
    }

    return /** @type {DeprecatedParamsApiResponse} */ (
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
