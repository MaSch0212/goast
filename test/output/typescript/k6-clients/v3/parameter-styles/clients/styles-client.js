// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { DeepObjectApiResponse, FormArrayApiResponse, FormArrayNoExplodeApiResponse, FormObjectApiResponse, LabelPathApiResponse, MatrixPathApiResponse, PipeDelimitedApiResponse, SimpleHeaderApiResponse, SimplePathApiResponse, SpaceDelimitedApiResponse } from '../models/responses/styles-responses';
 */

/**
 * Parameters for operation formArray
 *
 * @typedef FormArrayParams
 * @property {(string)[]} [tags]
 */

/**
 * Parameters for operation formArrayNoExplode
 *
 * @typedef FormArrayNoExplodeParams
 * @property {(string)[]} [tags]
 */

/**
 * Parameters for operation formObject
 *
 * @typedef FormObjectParams
 * @property {{
 *     label?: string;
 *     count?: number;
 *   }} [coordinates]
 */

/**
 * Parameters for operation spaceDelimited
 *
 * @typedef SpaceDelimitedParams
 * @property {(string)[]} [tags]
 */

/**
 * Parameters for operation pipeDelimited
 *
 * @typedef PipeDelimitedParams
 * @property {(string)[]} [tags]
 */

/**
 * Parameters for operation deepObject
 *
 * @typedef DeepObjectParams
 * @property {{
 *     label?: string;
 *     count?: number;
 *   }} [filter]
 */

/**
 * Parameters for operation simplePath
 *
 * @typedef SimplePathParams
 * @property {(string)[]} values
 */

/**
 * Parameters for operation labelPath
 *
 * @typedef LabelPathParams
 * @property {(string)[]} values
 */

/**
 * Parameters for operation matrixPath
 *
 * @typedef MatrixPathParams
 * @property {(string)[]} values
 */

/**
 * Parameters for operation simpleHeader
 *
 * @typedef SimpleHeaderParams
 * @property {(string)[]} [xTags]
 */

const FORM_ARRAY_PATH = '/query-form-array';
const FORM_ARRAY_NO_EXPLODE_PATH = '/query-form-array-no-explode';
const FORM_OBJECT_PATH = '/query-form-object';
const SPACE_DELIMITED_PATH = '/query-space-delimited';
const PIPE_DELIMITED_PATH = '/query-pipe-delimited';
const DEEP_OBJECT_PATH = '/query-deep-object';
const SIMPLE_PATH_PATH = '/simple-path/{values}';
const LABEL_PATH_PATH = '/label-path/{values}';
const MATRIX_PATH_PATH = '/matrix-path/{values}';
const SIMPLE_HEADER_PATH = '/simple-header';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class StylesClient {
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
   * @param {FormArrayParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<FormArrayApiResponse>}
   */
  async formArray(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, FORM_ARRAY_PATH, 'get');
    if (params) {
      rb.query('tags', params.tags, {
        style: 'form',
        explode: true,
      });
    }

    return /** @type {FormArrayApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {FormArrayNoExplodeParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<FormArrayNoExplodeApiResponse>}
   */
  async formArrayNoExplode(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, FORM_ARRAY_NO_EXPLODE_PATH, 'get');
    if (params) {
      rb.query('tags', params.tags, {
        style: 'form',
        explode: false,
      });
    }

    return /** @type {FormArrayNoExplodeApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {FormObjectParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<FormObjectApiResponse>}
   */
  async formObject(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, FORM_OBJECT_PATH, 'get');
    if (params) {
      rb.query('coordinates', params.coordinates, {
        style: 'form',
        explode: true,
      });
    }

    return /** @type {FormObjectApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {SpaceDelimitedParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<SpaceDelimitedApiResponse>}
   */
  async spaceDelimited(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, SPACE_DELIMITED_PATH, 'get');
    if (params) {
      rb.query('tags', params.tags, {
        style: 'spaceDelimited',
        explode: false,
      });
    }

    return /** @type {SpaceDelimitedApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {PipeDelimitedParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<PipeDelimitedApiResponse>}
   */
  async pipeDelimited(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, PIPE_DELIMITED_PATH, 'get');
    if (params) {
      rb.query('tags', params.tags, {
        style: 'pipeDelimited',
        explode: false,
      });
    }

    return /** @type {PipeDelimitedApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {DeepObjectParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<DeepObjectApiResponse>}
   */
  async deepObject(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, DEEP_OBJECT_PATH, 'get');
    if (params) {
      rb.query('filter', params.filter, {
        style: 'deepObject',
        explode: true,
      });
    }

    return /** @type {DeepObjectApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {SimplePathParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<SimplePathApiResponse>}
   */
  async simplePath(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, SIMPLE_PATH_PATH, 'get');
    rb.path('values', params.values, {
      style: 'simple',
      explode: false,
    });

    return /** @type {SimplePathApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {LabelPathParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<LabelPathApiResponse>}
   */
  async labelPath(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, LABEL_PATH_PATH, 'get');
    rb.path('values', params.values, {
      style: 'label',
      explode: false,
    });

    return /** @type {LabelPathApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {MatrixPathParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<MatrixPathApiResponse>}
   */
  async matrixPath(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, MATRIX_PATH_PATH, 'get');
    rb.path('values', params.values, {
      style: 'matrix',
      explode: false,
    });

    return /** @type {MatrixPathApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {SimpleHeaderParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<SimpleHeaderApiResponse>}
   */
  async simpleHeader(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, SIMPLE_HEADER_PATH, 'get');
    if (params) {
      rb.header('X-Tags', params.xTags, {
        style: 'simple',
        explode: false,
      });
    }

    return /** @type {SimpleHeaderApiResponse} */ (
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
