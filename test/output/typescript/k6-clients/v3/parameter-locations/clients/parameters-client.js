// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { ParamSchema } from '../models/param-schema';
 * @import { AllowEmptyValueParamApiResponse, CookieParamsApiResponse, DescribedParamsApiResponse, HeaderParamsApiResponse, MixedParamsApiResponse, QueryParamsApiResponse, ReservedCharParamApiResponse, TwoPathParamsApiResponse } from '../models/responses/parameters-responses';
 */

/**
 * Parameters for operation twoPathParams
 *
 * @typedef TwoPathParamsParams
 * @property {string} id
 * @property {number} sub
 */

/**
 * Parameters for operation queryParams
 *
 * @typedef QueryParamsParams
 * @property {string} requiredString
 * @property {string} [optionalString]
 * @property {number} [intWithDefault]
 * @property {boolean} [flag]
 */

/**
 * Parameters for operation headerParams
 *
 * @typedef HeaderParamsParams
 * @property {string} xRequestId
 * @property {string} [xOptionalHeader]
 */

/**
 * Parameters for operation cookieParams
 *
 * @typedef CookieParamsParams
 * @property {string} [session]
 */

/**
 * Parameters for operation mixedParams
 *
 * @typedef MixedParamsParams
 * @property {string} id
 * @property {string} [filter]
 * @property {string} [xTraceId]
 * @property {string} [session]
 */

/**
 * Parameters for operation describedParams
 *
 * @typedef DescribedParamsParams
 * @property {string} [withDescription] A parameter with a description.
 * @property {string} [withoutDescription]
 * @property {string} [withExample]
 * @property {ParamSchema} [withRefSchema]
 */

/**
 * Parameters for operation allowEmptyValueParam
 *
 * @typedef AllowEmptyValueParamParams
 * @property {string} [search]
 */

/**
 * Parameters for operation reservedCharParam
 *
 * @typedef ReservedCharParamParams
 * @property {string} [filter]
 */

const TWO_PATH_PARAMS_PATH = '/path/{id}/{sub}';
const QUERY_PARAMS_PATH = '/query';
const HEADER_PARAMS_PATH = '/header';
const COOKIE_PARAMS_PATH = '/cookie';
const MIXED_PARAMS_PATH = '/mixed/{id}';
const DESCRIBED_PARAMS_PATH = '/described';
const ALLOW_EMPTY_VALUE_PARAM_PATH = '/empty-value';
const RESERVED_CHAR_PARAM_PATH = '/reserved';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class ParametersClient {
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
   * @param {TwoPathParamsParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<TwoPathParamsApiResponse>}
   */
  async twoPathParams(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, TWO_PATH_PARAMS_PATH, 'get');
    rb.path('id', params.id, {});
    rb.path('sub', params.sub, {});

    return /** @type {TwoPathParamsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {QueryParamsParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<QueryParamsApiResponse>}
   */
  async queryParams(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, QUERY_PARAMS_PATH, 'get');
    rb.query('requiredString', params.requiredString, {});
    rb.query('optionalString', params.optionalString, {});
    rb.query('intWithDefault', params.intWithDefault, {});
    rb.query('flag', params.flag, {});

    return /** @type {QueryParamsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {HeaderParamsParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<HeaderParamsApiResponse>}
   */
  async headerParams(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, HEADER_PARAMS_PATH, 'get');
    rb.header('X-Request-Id', params.xRequestId, {});
    rb.header('X-Optional-Header', params.xOptionalHeader, {});

    return /** @type {HeaderParamsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {CookieParamsParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<CookieParamsApiResponse>}
   */
  async cookieParams(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, COOKIE_PARAMS_PATH, 'get');
    if (params) {
    }

    return /** @type {CookieParamsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {MixedParamsParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<MixedParamsApiResponse>}
   */
  async mixedParams(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, MIXED_PARAMS_PATH, 'get');
    rb.path('id', params.id, {});
    rb.query('filter', params.filter, {});
    rb.header('X-Trace-Id', params.xTraceId, {});

    return /** @type {MixedParamsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {DescribedParamsParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<DescribedParamsApiResponse>}
   */
  async describedParams(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, DESCRIBED_PARAMS_PATH, 'get');
    if (params) {
      rb.query('withDescription', params.withDescription, {});
      rb.query('withoutDescription', params.withoutDescription, {});
      rb.query('withExample', params.withExample, {});
      rb.query('withRefSchema', params.withRefSchema, {});
    }

    return /** @type {DescribedParamsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {AllowEmptyValueParamParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<AllowEmptyValueParamApiResponse>}
   */
  async allowEmptyValueParam(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, ALLOW_EMPTY_VALUE_PARAM_PATH, 'get');
    if (params) {
      rb.query('search', params.search, {});
    }

    return /** @type {AllowEmptyValueParamApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {ReservedCharParamParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<ReservedCharParamApiResponse>}
   */
  async reservedCharParam(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, RESERVED_CHAR_PARAM_PATH, 'get');
    if (params) {
      rb.query('filter', params.filter, {});
    }

    return /** @type {ReservedCharParamApiResponse} */ (
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
