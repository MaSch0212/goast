// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { Pet } from '../models/pet';
 * @import { CreatePetApiResponse, DeletePetApiResponse, GetPetApiResponse, ListPetsApiResponse, SearchPetsApiResponse } from '../models/responses/pets-responses';
 */

/**
 * Parameters for operation createPet
 *
 * @typedef CreatePetParams
 * @property {Pet} body
 */

/**
 * Parameters for operation getPet
 *
 * @typedef GetPetParams
 * @property {string} id
 */

/**
 * Parameters for operation deletePet
 *
 * @typedef DeletePetParams
 * @property {string} id
 */

const LIST_PETS_PATH = '/pets';
const CREATE_PET_PATH = '/pets';
const GET_PET_PATH = '/pets/{id}';
const DELETE_PET_PATH = '/pets/{id}';
const SEARCH_PETS_PATH = '/pets/search';

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
   * @param {DeletePetParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<DeletePetApiResponse>}
   */
  async deletePet(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, DELETE_PET_PATH, 'delete');
    rb.path('id', params.id, {});

    return /** @type {DeletePetApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {Params} [k6Params]
   * @returns {Promise<SearchPetsApiResponse>}
   */
  async searchPets(k6Params) {
    const rb = new RequestBuilder(this.rootUrl, SEARCH_PETS_PATH, 'get');

    return /** @type {SearchPetsApiResponse} */ (
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
