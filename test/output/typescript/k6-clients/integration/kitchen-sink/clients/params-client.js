// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { AllLocationsApiResponse, GetEncodedApiResponse, PathStyleSimpleApiResponse, StyleMatrixApiResponse } from '../models/responses/params-responses';
 */

/**
 * Parameters for operation allLocations
 *
 * @typedef AllLocationsParams
 * @property {string} pathParam
 * @property {string} [queryParam]
 * @property {string} [xHeaderParam]
 * @property {string} [session]
 */

/**
 * Parameters for operation styleMatrix
 *
 * @typedef StyleMatrixParams
 * @property {(string)[]} [formExploded]
 * @property {(string)[]} [formUnexploded]
 * @property {(string)[]} [spaceDelimited]
 */

/**
 * Parameters for operation pathStyleSimple
 *
 * @typedef PathStyleSimpleParams
 * @property {(string)[]} values
 */

/**
 * Parameters for operation getEncoded
 *
 * @typedef GetEncodedParams
 * @property {string} value
 * @property {string} [raw]
 */

const ALL_LOCATIONS_PATH = '/locations/{pathParam}';
const STYLE_MATRIX_PATH = '/styles';
const PATH_STYLE_SIMPLE_PATH = '/styles/{values}';
const GET_ENCODED_PATH = '/encoded/{value}';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class ParamsClient {
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
   * @param {AllLocationsParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<AllLocationsApiResponse>}
   */
  async allLocations(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, ALL_LOCATIONS_PATH, 'get');
    rb.path('pathParam', params.pathParam, {});
    rb.query('queryParam', params.queryParam, {});
    rb.header('X-Header-Param', params.xHeaderParam, {});

    return /** @type {AllLocationsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {StyleMatrixParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<StyleMatrixApiResponse>}
   */
  async styleMatrix(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, STYLE_MATRIX_PATH, 'get');
    if (params) {
      rb.query('formExploded', params.formExploded, {
        style: 'form',
        explode: true,
      });
      rb.query('formUnexploded', params.formUnexploded, {
        style: 'form',
        explode: false,
      });
      rb.query('spaceDelimited', params.spaceDelimited, {
        style: 'spaceDelimited',
        explode: false,
      });
    }

    return /** @type {StyleMatrixApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {PathStyleSimpleParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<PathStyleSimpleApiResponse>}
   */
  async pathStyleSimple(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, PATH_STYLE_SIMPLE_PATH, 'get');
    rb.path('values', params.values, {
      style: 'simple',
      explode: false,
    });

    return /** @type {PathStyleSimpleApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {GetEncodedParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<GetEncodedApiResponse>}
   */
  async getEncoded(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, GET_ENCODED_PATH, 'get');
    rb.path('value', params.value, {});
    rb.query('raw', params.raw, {});

    return /** @type {GetEncodedApiResponse} */ (
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
