// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { GetPetApiResponse } from '../models/responses/pets-responses';
 */

/**
 * Parameters for operation getPet
 *
 * @typedef GetPetParams
 * @property {string} id
 */

const GET_PET_PATH = '/pets/{id}';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class PetsClient {
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
   * @param {GetPetParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<GetPetApiResponse>}
   */
  async getPet(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, GET_PET_PATH, 'get');
    rb.path('id', params.id, {});

    return /** @type {GetPetApiResponse} */ (
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
