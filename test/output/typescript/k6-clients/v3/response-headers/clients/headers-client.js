// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { DeprecatedHeaderApiResponse, HeadersAndBodyApiResponse, HeadersOnNoContentApiResponse, MultipleHeadersApiResponse, RefHeaderApiResponse, RequiredHeaderApiResponse, SingleHeaderApiResponse } from '../models/responses/headers-responses';
 */

const SINGLE_HEADER_PATH = '/one';
const MULTIPLE_HEADERS_PATH = '/many';
const REQUIRED_HEADER_PATH = '/required';
const DEPRECATED_HEADER_PATH = '/deprecated';
const REF_HEADER_PATH = '/ref';
const HEADERS_ON_NO_CONTENT_PATH = '/no-content-headers';
const HEADERS_AND_BODY_PATH = '/both';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class HeadersClient {
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
   * @returns {Promise<SingleHeaderApiResponse>}
   */
  async singleHeader(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, SINGLE_HEADER_PATH, 'get');

    return /** @type {SingleHeaderApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<MultipleHeadersApiResponse>}
   */
  async multipleHeaders(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, MULTIPLE_HEADERS_PATH, 'get');

    return /** @type {MultipleHeadersApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<RequiredHeaderApiResponse>}
   */
  async requiredHeader(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, REQUIRED_HEADER_PATH, 'get');

    return /** @type {RequiredHeaderApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<DeprecatedHeaderApiResponse>}
   */
  async deprecatedHeader(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, DEPRECATED_HEADER_PATH, 'get');

    return /** @type {DeprecatedHeaderApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<RefHeaderApiResponse>}
   */
  async refHeader(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, REF_HEADER_PATH, 'get');

    return /** @type {RefHeaderApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<HeadersOnNoContentApiResponse>}
   */
  async headersOnNoContent(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, HEADERS_ON_NO_CONTENT_PATH, 'get');

    return /** @type {HeadersOnNoContentApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<HeadersAndBodyApiResponse>}
   */
  async headersAndBody(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, HEADERS_AND_BODY_PATH, 'get');

    return /** @type {HeadersAndBodyApiResponse} */ (
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
