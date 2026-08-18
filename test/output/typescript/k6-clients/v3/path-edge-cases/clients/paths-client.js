// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { CaseVarietyApiResponse, OverlapLiteralApiResponse, OverlapTemplatedApiResponse, ParamOnlyPathApiResponse, ThreeParamsApiResponse, TrailingSlashApiResponse, VeryDeepPathApiResponse, WithAtApiResponse, WithColonApiResponse, WithDashApiResponse, WithDotApiResponse, WithTildeApiResponse, WithUnderscoreApiResponse } from '../models/responses/paths-responses';
 */

/**
 * Parameters for operation overlapTemplated
 *
 * @typedef OverlapTemplatedParams
 * @property {string} id
 */

/**
 * Parameters for operation paramOnlyPath
 *
 * @typedef ParamOnlyPathParams
 * @property {string} id
 */

/**
 * Parameters for operation threeParams
 *
 * @typedef ThreeParamsParams
 * @property {string} p1
 * @property {string} p2
 * @property {string} p3
 */

const OVERLAP_TEMPLATED_PATH = '/overlap/{id}';
const OVERLAP_LITERAL_PATH = '/overlap/fixed';
const WITH_DOT_PATH = '/with.dot';
const WITH_DASH_PATH = '/with-dash';
const WITH_UNDERSCORE_PATH = '/with_underscore';
const WITH_TILDE_PATH = '/with~tilde';
const WITH_COLON_PATH = '/with:colon';
const WITH_AT_PATH = '/with@at';
const TRAILING_SLASH_PATH = '/trailing/';
const PARAM_ONLY_PATH_PATH = '/{id}';
const THREE_PARAMS_PATH = '/a/{p1}/b/{p2}/c/{p3}';
const CASE_VARIETY_PATH = '/UPPER/Mixed/lower';
const VERY_DEEP_PATH_PATH = '/very/deep/nested/path/with/many/segments/here';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class PathsClient {
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
   * @param {OverlapTemplatedParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<OverlapTemplatedApiResponse>}
   */
  async overlapTemplated(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, OVERLAP_TEMPLATED_PATH, 'get');
    rb.path('id', params.id, {});

    return /** @type {OverlapTemplatedApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<OverlapLiteralApiResponse>}
   */
  async overlapLiteral(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, OVERLAP_LITERAL_PATH, 'get');

    return /** @type {OverlapLiteralApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<WithDotApiResponse>}
   */
  async withDot(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, WITH_DOT_PATH, 'get');

    return /** @type {WithDotApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<WithDashApiResponse>}
   */
  async withDash(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, WITH_DASH_PATH, 'get');

    return /** @type {WithDashApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<WithUnderscoreApiResponse>}
   */
  async withUnderscore(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, WITH_UNDERSCORE_PATH, 'get');

    return /** @type {WithUnderscoreApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<WithTildeApiResponse>}
   */
  async withTilde(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, WITH_TILDE_PATH, 'get');

    return /** @type {WithTildeApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<WithColonApiResponse>}
   */
  async withColon(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, WITH_COLON_PATH, 'get');

    return /** @type {WithColonApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<WithAtApiResponse>}
   */
  async withAt(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, WITH_AT_PATH, 'get');

    return /** @type {WithAtApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<TrailingSlashApiResponse>}
   */
  async trailingSlash(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, TRAILING_SLASH_PATH, 'get');

    return /** @type {TrailingSlashApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {ParamOnlyPathParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<ParamOnlyPathApiResponse>}
   */
  async paramOnlyPath(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, PARAM_ONLY_PATH_PATH, 'get');
    rb.path('id', params.id, {});

    return /** @type {ParamOnlyPathApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {ThreeParamsParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<ThreeParamsApiResponse>}
   */
  async threeParams(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, THREE_PARAMS_PATH, 'get');
    rb.path('p1', params.p1, {});
    rb.path('p2', params.p2, {});
    rb.path('p3', params.p3, {});

    return /** @type {ThreeParamsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<CaseVarietyApiResponse>}
   */
  async caseVariety(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, CASE_VARIETY_PATH, 'get');

    return /** @type {CaseVarietyApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<VeryDeepPathApiResponse>}
   */
  async veryDeepPath(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, VERY_DEEP_PATH_PATH, 'get');

    return /** @type {VeryDeepPathApiResponse} */ (
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
