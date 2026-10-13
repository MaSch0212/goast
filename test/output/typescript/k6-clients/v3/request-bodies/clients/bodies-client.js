// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { Payload } from '../models/payload';
 * @import { AnyBodyApiResponse, ArrayJsonBodyApiResponse, BinaryBodyApiResponse, DescribedBodyApiResponse, FormBodyApiResponse, InlineJsonBodyApiResponse, JsonBodyApiResponse, MultiContentBodyApiResponse, OptionalJsonBodyApiResponse, PrimitiveJsonBodyApiResponse, RefBodyApiResponse, TextBodyApiResponse } from '../models/responses/bodies-responses';
 */

/**
 * Parameters for operation jsonBody
 *
 * @typedef JsonBodyParams
 * @property {Payload} body
 */

/**
 * Parameters for operation optionalJsonBody
 *
 * @typedef OptionalJsonBodyParams
 * @property {Payload} [body]
 */

/**
 * Parameters for operation inlineJsonBody
 *
 * @typedef InlineJsonBodyParams
 * @property {{
 *     name: string;
 *     count?: number;
 *   }} body
 */

/**
 * Parameters for operation arrayJsonBody
 *
 * @typedef ArrayJsonBodyParams
 * @property {(Payload)[]} body
 */

/**
 * Parameters for operation primitiveJsonBody
 *
 * @typedef PrimitiveJsonBodyParams
 * @property {string} body
 */

/**
 * Parameters for operation textBody
 *
 * @typedef TextBodyParams
 * @property {string} body
 */

/**
 * Parameters for operation binaryBody
 *
 * @typedef BinaryBodyParams
 * @property {Blob} body
 */

/**
 * Parameters for operation anyBody
 *
 * @typedef AnyBodyParams
 * @property {unknown} body
 */

/**
 * Parameters for operation multiContentBody
 *
 * @typedef MultiContentBodyParams
 * @property {Payload} body
 */

/**
 * Parameters for operation formBody
 *
 * @typedef FormBodyParams
 * @property {{
 *     username?: string;
 *     age?: number;
 *     subscribed?: boolean;
 *   }} body
 */

/**
 * Parameters for operation describedBody
 *
 * @typedef DescribedBodyParams
 * @property {Payload} body A body with an explanation of its purpose.
 */

/**
 * Parameters for operation refBody
 *
 * @typedef RefBodyParams
 * @property {Payload} body A request body shared through components.requestBodies.
 */

const JSON_BODY_PATH = '/json';
const OPTIONAL_JSON_BODY_PATH = '/json-optional';
const INLINE_JSON_BODY_PATH = '/json-inline';
const ARRAY_JSON_BODY_PATH = '/json-array';
const PRIMITIVE_JSON_BODY_PATH = '/json-primitive';
const TEXT_BODY_PATH = '/text';
const BINARY_BODY_PATH = '/binary';
const ANY_BODY_PATH = '/any';
const MULTI_CONTENT_BODY_PATH = '/multi-content';
const FORM_BODY_PATH = '/form';
const DESCRIBED_BODY_PATH = '/described-body';
const REF_BODY_PATH = '/ref-body';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class BodiesClient {
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
   * @param {JsonBodyParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<JsonBodyApiResponse>}
   */
  async jsonBody(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, JSON_BODY_PATH, 'post');
    rb.body(params.body, 'application/json');

    return /** @type {JsonBodyApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {OptionalJsonBodyParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<OptionalJsonBodyApiResponse>}
   */
  async optionalJsonBody(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, OPTIONAL_JSON_BODY_PATH, 'post');
    if (params) {
      rb.body(params.body, 'application/json');
    }

    return /** @type {OptionalJsonBodyApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {InlineJsonBodyParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<InlineJsonBodyApiResponse>}
   */
  async inlineJsonBody(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, INLINE_JSON_BODY_PATH, 'post');
    rb.body(params.body, 'application/json');

    return /** @type {InlineJsonBodyApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {ArrayJsonBodyParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<ArrayJsonBodyApiResponse>}
   */
  async arrayJsonBody(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, ARRAY_JSON_BODY_PATH, 'post');
    rb.body(params.body, 'application/json');

    return /** @type {ArrayJsonBodyApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {PrimitiveJsonBodyParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<PrimitiveJsonBodyApiResponse>}
   */
  async primitiveJsonBody(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, PRIMITIVE_JSON_BODY_PATH, 'post');
    rb.body(params.body, 'application/json');

    return /** @type {PrimitiveJsonBodyApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {TextBodyParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<TextBodyApiResponse>}
   */
  async textBody(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, TEXT_BODY_PATH, 'post');
    rb.body(params.body, 'text/plain');

    return /** @type {TextBodyApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {BinaryBodyParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<BinaryBodyApiResponse>}
   */
  async binaryBody(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, BINARY_BODY_PATH, 'post');
    rb.body(params.body, 'application/octet-stream');

    return /** @type {BinaryBodyApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {AnyBodyParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<AnyBodyApiResponse>}
   */
  async anyBody(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, ANY_BODY_PATH, 'post');
    rb.body(params.body, '*/*');

    return /** @type {AnyBodyApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {MultiContentBodyParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<MultiContentBodyApiResponse>}
   */
  async multiContentBody(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, MULTI_CONTENT_BODY_PATH, 'post');
    rb.body(params.body, 'application/json');

    return /** @type {MultiContentBodyApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {FormBodyParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<FormBodyApiResponse>}
   */
  async formBody(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, FORM_BODY_PATH, 'post');
    rb.body(params.body, 'application/x-www-form-urlencoded');

    return /** @type {FormBodyApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {DescribedBodyParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<DescribedBodyApiResponse>}
   */
  async describedBody(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, DESCRIBED_BODY_PATH, 'post');
    rb.body(params.body, 'application/json');

    return /** @type {DescribedBodyApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {RefBodyParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<RefBodyApiResponse>}
   */
  async refBody(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, REF_BODY_PATH, 'post');
    rb.body(params.body, 'application/json');

    return /** @type {RefBodyApiResponse} */ (
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
