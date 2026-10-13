// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { ArrayResponseApiResponse, EmptyBody200ApiResponse, ErrorCodesApiResponse, MixedExactAndRangeApiResponse, MultiContentResponseApiResponse, NoContentApiResponse, OnlyDefaultApiResponse, PrimitiveResponseApiResponse, RangeCodesApiResponse, RefResponseApiResponse, SuccessAndDefaultApiResponse, TwoSuccessCodesApiResponse } from '../models/responses/responses-responses';
 */

const TWO_SUCCESS_CODES_PATH = '/two-success';
const SUCCESS_AND_DEFAULT_PATH = '/default';
const ONLY_DEFAULT_PATH = '/only-default';
const NO_CONTENT_PATH = '/no-content';
const EMPTY_BODY_200_PATH = '/empty-200';
const RANGE_CODES_PATH = '/ranges';
const MIXED_EXACT_AND_RANGE_PATH = '/mixed-codes';
const ERROR_CODES_PATH = '/errors';
const MULTI_CONTENT_RESPONSE_PATH = '/multi-content';
const PRIMITIVE_RESPONSE_PATH = '/primitive';
const ARRAY_RESPONSE_PATH = '/array';
const REF_RESPONSE_PATH = '/ref-response';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class ResponsesClient {
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
   * @returns {Promise<TwoSuccessCodesApiResponse>}
   */
  async twoSuccessCodes(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, TWO_SUCCESS_CODES_PATH, 'get');

    return /** @type {TwoSuccessCodesApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<SuccessAndDefaultApiResponse>}
   */
  async successAndDefault(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, SUCCESS_AND_DEFAULT_PATH, 'get');

    return /** @type {SuccessAndDefaultApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<OnlyDefaultApiResponse>}
   */
  async onlyDefault(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, ONLY_DEFAULT_PATH, 'get');

    return /** @type {OnlyDefaultApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<NoContentApiResponse>}
   */
  async noContent(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, NO_CONTENT_PATH, 'get');

    return /** @type {NoContentApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<EmptyBody200ApiResponse>}
   */
  async emptyBody200(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, EMPTY_BODY_200_PATH, 'get');

    return /** @type {EmptyBody200ApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<RangeCodesApiResponse>}
   */
  async rangeCodes(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, RANGE_CODES_PATH, 'get');

    return /** @type {RangeCodesApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<MixedExactAndRangeApiResponse>}
   */
  async mixedExactAndRange(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, MIXED_EXACT_AND_RANGE_PATH, 'get');

    return /** @type {MixedExactAndRangeApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<ErrorCodesApiResponse>}
   */
  async errorCodes(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, ERROR_CODES_PATH, 'get');

    return /** @type {ErrorCodesApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<MultiContentResponseApiResponse>}
   */
  async multiContentResponse(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, MULTI_CONTENT_RESPONSE_PATH, 'get');

    return /** @type {MultiContentResponseApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<PrimitiveResponseApiResponse>}
   */
  async primitiveResponse(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, PRIMITIVE_RESPONSE_PATH, 'get');

    return /** @type {PrimitiveResponseApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<ArrayResponseApiResponse>}
   */
  async arrayResponse(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, ARRAY_RESPONSE_PATH, 'get');

    return /** @type {ArrayResponseApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<RefResponseApiResponse>}
   */
  async refResponse(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, REF_RESPONSE_PATH, 'get');

    return /** @type {RefResponseApiResponse} */ (
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
