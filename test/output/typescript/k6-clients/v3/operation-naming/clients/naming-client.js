// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { DeleteItemsIdApiResponse, GetAbcdeApiResponse, GetApiResponse, GetItemsApiResponse, GetItemsIdApiResponse, GetItemsIdSubItemsSubIdApiResponse, GetWithSummaryApiResponse, HeadItemsApiResponse, OptionsItemsApiResponse, PatchItemsIdApiResponse, PostItemsApiResponse, PutItemsIdApiResponse } from '../models/responses/naming-responses';
 */

/**
 * Parameters for operation getItemsId
 *
 * @typedef GetItemsIdParams
 * @property {string} id
 */

/**
 * Parameters for operation putItemsId
 *
 * @typedef PutItemsIdParams
 * @property {string} id
 */

/**
 * Parameters for operation deleteItemsId
 *
 * @typedef DeleteItemsIdParams
 * @property {string} id
 */

/**
 * Parameters for operation patchItemsId
 *
 * @typedef PatchItemsIdParams
 * @property {string} id
 */

/**
 * Parameters for operation getItemsIdSubItemsSubId
 *
 * @typedef GetItemsIdSubItemsSubIdParams
 * @property {string} id
 * @property {string} subId
 */

const GET_ITEMS_PATH = '/items';
const POST_ITEMS_PATH = '/items';
const OPTIONS_ITEMS_PATH = '/items';
const HEAD_ITEMS_PATH = '/items';
const GET_ITEMS_ID_PATH = '/items/{id}';
const PUT_ITEMS_ID_PATH = '/items/{id}';
const DELETE_ITEMS_ID_PATH = '/items/{id}';
const PATCH_ITEMS_ID_PATH = '/items/{id}';
const GET_ITEMS_ID_SUB_ITEMS_SUB_ID_PATH = '/items/{id}/sub-items/{subId}';
const GET_PATH = '/';
const GET_ABCDE_PATH = '/a/b/c/d/e';
const GET_WITH_SUMMARY_PATH = '/with-summary';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class NamingClient {
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
   * @returns {Promise<GetItemsApiResponse>}
   */
  async getItems(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, GET_ITEMS_PATH, 'get');

    return /** @type {GetItemsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<PostItemsApiResponse>}
   */
  async postItems(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, POST_ITEMS_PATH, 'post');

    return /** @type {PostItemsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<OptionsItemsApiResponse>}
   */
  async optionsItems(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, OPTIONS_ITEMS_PATH, 'options');

    return /** @type {OptionsItemsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<HeadItemsApiResponse>}
   */
  async headItems(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, HEAD_ITEMS_PATH, 'head');

    return /** @type {HeadItemsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {GetItemsIdParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<GetItemsIdApiResponse>}
   */
  async getItemsId(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, GET_ITEMS_ID_PATH, 'get');
    rb.path('id', params.id, {});

    return /** @type {GetItemsIdApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {PutItemsIdParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<PutItemsIdApiResponse>}
   */
  async putItemsId(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, PUT_ITEMS_ID_PATH, 'put');
    rb.path('id', params.id, {});

    return /** @type {PutItemsIdApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {DeleteItemsIdParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<DeleteItemsIdApiResponse>}
   */
  async deleteItemsId(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, DELETE_ITEMS_ID_PATH, 'delete');
    rb.path('id', params.id, {});

    return /** @type {DeleteItemsIdApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {PatchItemsIdParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<PatchItemsIdApiResponse>}
   */
  async patchItemsId(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, PATCH_ITEMS_ID_PATH, 'patch');
    rb.path('id', params.id, {});

    return /** @type {PatchItemsIdApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {GetItemsIdSubItemsSubIdParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<GetItemsIdSubItemsSubIdApiResponse>}
   */
  async getItemsIdSubItemsSubId(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, GET_ITEMS_ID_SUB_ITEMS_SUB_ID_PATH, 'get');
    rb.path('id', params.id, {});
    rb.path('subId', params.subId, {});

    return /** @type {GetItemsIdSubItemsSubIdApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<GetApiResponse>}
   */
  async get(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, GET_PATH, 'get');

    return /** @type {GetApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<GetAbcdeApiResponse>}
   */
  async getABCDE(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, GET_ABCDE_PATH, 'get');

    return /** @type {GetAbcdeApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<GetWithSummaryApiResponse>}
   */
  async getWithSummary(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, GET_WITH_SUMMARY_PATH, 'get');

    return /** @type {GetWithSummaryApiResponse} */ (
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
