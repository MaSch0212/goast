// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { Payload } from '../models/payload';
 * @import { BodyParamApiResponse, FileUploadApiResponse, FormDataParamsApiResponse, QueryParamsApiResponse } from '../models/responses/parameters-responses';
 */

/**
 * Parameters for operation bodyParam
 *
 * @typedef BodyParamParams
 * @property {Payload} payload
 */

/**
 * Parameters for operation formDataParams
 *
 * @typedef FormDataParamsParams
 * @property {unknown} [title]
 * @property {unknown} [count]
 * @property {unknown} [active]
 */

/**
 * Parameters for operation fileUpload
 *
 * @typedef FileUploadParams
 * @property {unknown} [file]
 * @property {unknown} [description]
 */

/**
 * Parameters for operation queryParams
 *
 * @typedef QueryParamsParams
 * @property {unknown} [tags]
 * @property {unknown} [ids]
 */

const BODY_PARAM_PATH = '/body';
const FORM_DATA_PARAMS_PATH = '/form';
const FILE_UPLOAD_PATH = '/upload';
const QUERY_PARAMS_PATH = '/query';

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
   * @param {BodyParamParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<BodyParamApiResponse>}
   */
  async bodyParam(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, BODY_PARAM_PATH, 'post');


    return /** @type {BodyParamApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {FormDataParamsParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<FormDataParamsApiResponse>}
   */
  async formDataParams(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, FORM_DATA_PARAMS_PATH, 'post');
    if (params) {
    }

    return /** @type {FormDataParamsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {FileUploadParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<FileUploadApiResponse>}
   */
  async fileUpload(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, FILE_UPLOAD_PATH, 'post');
    if (params) {
    }

    return /** @type {FileUploadApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {QueryParamsParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<QueryParamsApiResponse>}
   */
  async queryParams(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, QUERY_PARAMS_PATH, 'get');
    if (params) {
      rb.query('tags', params.tags, {});
      rb.query('ids', params.ids, {});
    }

    return /** @type {QueryParamsApiResponse} */ (
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
