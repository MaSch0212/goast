// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { Pet } from '../models/pet';
 * @import { CreatePetApiResponse, GetOwnerApiResponse, ListPetsApiResponse } from '../models/responses/service-1-responses';
 */

/**
 * Parameters for operation getOwner
 *
 * @typedef GetOwnerParams
 * @property {string} id
 */

/**
 * Parameters for operation createPet
 *
 * @typedef CreatePetParams
 * @property {Pet} body
 */

const GET_OWNER_PATH = '/owners/{id}';
const LIST_PETS_PATH = '/pets';
const CREATE_PET_PATH = '/pets';

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
   * @param {GetOwnerParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<GetOwnerApiResponse>}
   */
  async getOwner(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, GET_OWNER_PATH, 'get');
    rb.path('id', params.id, {});

    return /** @type {GetOwnerApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<ListPetsApiResponse>}
   */
  async listPets(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, LIST_PETS_PATH, 'get');

    return /** @type {ListPetsApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {CreatePetParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<CreatePetApiResponse>}
   */
  async createPet(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, CREATE_PET_PATH, 'post');
    rb.body(params.body, 'application/json');

    return /** @type {CreatePetApiResponse} */ (
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
