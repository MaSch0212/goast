// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { AndSecurityApiResponse, InheritsSecurityApiResponse, MultiSecurityApiResponse, NoSecurityApiResponse, OverridesSecurityApiResponse, ScopedSecurityApiResponse } from '../models/responses/service-1-responses';
 */

const INHERITS_SECURITY_PATH = '/inherits-security';
const OVERRIDES_SECURITY_PATH = '/overrides-security';
const NO_SECURITY_PATH = '/no-security';
const MULTI_SECURITY_PATH = '/multi-security';
const AND_SECURITY_PATH = '/and-security';
const SCOPED_SECURITY_PATH = '/scoped';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class Service1Client {
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
   * @returns {Promise<InheritsSecurityApiResponse>}
   */
  async inheritsSecurity(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, INHERITS_SECURITY_PATH, 'get');

    return /** @type {InheritsSecurityApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<OverridesSecurityApiResponse>}
   */
  async overridesSecurity(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, OVERRIDES_SECURITY_PATH, 'get');

    return /** @type {OverridesSecurityApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<NoSecurityApiResponse>}
   */
  async noSecurity(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, NO_SECURITY_PATH, 'get');

    return /** @type {NoSecurityApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<MultiSecurityApiResponse>}
   */
  async multiSecurity(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, MULTI_SECURITY_PATH, 'get');

    return /** @type {MultiSecurityApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<AndSecurityApiResponse>}
   */
  async andSecurity(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, AND_SECURITY_PATH, 'get');

    return /** @type {AndSecurityApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<ScopedSecurityApiResponse>}
   */
  async scopedSecurity(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, SCOPED_SECURITY_PATH, 'get');

    return /** @type {ScopedSecurityApiResponse} */ (
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
