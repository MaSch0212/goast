// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { InheritsAndAddsApiResponse, InheritsParamsApiResponse, OverridesParamApiResponse, RefParamApiResponse } from '../models/responses/inheritance-responses';
 */

/**
 * Parameters for operation inheritsParams
 *
 * @typedef InheritsParamsParams
 * @property {string} id
 * @property {string} [common]
 */

/**
 * Parameters for operation inheritsAndAdds
 *
 * @typedef InheritsAndAddsParams
 * @property {string} id
 * @property {string} [common]
 * @property {string} [extra]
 */

/**
 * Parameters for operation overridesParam
 *
 * @typedef OverridesParamParams
 * @property {string} id
 * @property {number} [common] Overrides the inherited parameter with a different type.
 */

/**
 * Parameters for operation refParam
 *
 * @typedef RefParamParams
 * @property {string} id
 * @property {number} [page]
 */

const INHERITS_PARAMS_PATH = '/inherited/{id}';
const INHERITS_AND_ADDS_PATH = '/inherited/{id}';
const OVERRIDES_PARAM_PATH = '/overridden/{id}';
const REF_PARAM_PATH = '/ref-param/{id}';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class InheritanceClient {
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
   * @param {InheritsParamsParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<InheritsParamsApiResponse>}
   */
  async inheritsParams(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, INHERITS_PARAMS_PATH, 'get');
    rb.path('id', params.id, {});
    rb.query('common', params.common, {});

    return /** @type {InheritsParamsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {InheritsAndAddsParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<InheritsAndAddsApiResponse>}
   */
  async inheritsAndAdds(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, INHERITS_AND_ADDS_PATH, 'post');
    rb.path('id', params.id, {});
    rb.query('common', params.common, {});
    rb.query('extra', params.extra, {});

    return /** @type {InheritsAndAddsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {OverridesParamParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<OverridesParamApiResponse>}
   */
  async overridesParam(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, OVERRIDES_PARAM_PATH, 'get');
    rb.path('id', params.id, {});
    rb.query('common', params.common, {});

    return /** @type {OverridesParamApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {RefParamParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<RefParamApiResponse>}
   */
  async refParam(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, REF_PARAM_PATH, 'get');
    rb.path('id', params.id, {});
    rb.query('page', params.page, {});

    return /** @type {RefParamApiResponse} */ (
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
