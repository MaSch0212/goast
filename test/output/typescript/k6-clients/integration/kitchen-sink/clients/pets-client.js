// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { PetUpdate } from '../models/pet-update';
 * @import { Pet } from '../models/pet';
 * @import { CreatePetApiResponse, DeletePetApiResponse, GetPetApiResponse, UpdatePetApiResponse, UploadPetPhotoApiResponse } from '../models/responses/pets-responses';
 */

/**
 * Parameters for operation getPet
 *
 * @typedef GetPetParams
 * @property {string} id
 */

/**
 * Parameters for operation updatePet
 *
 * @typedef UpdatePetParams
 * @property {string} id
 * @property {PetUpdate} body
 */

/**
 * Parameters for operation deletePet
 *
 * @typedef DeletePetParams
 * @property {string} id
 */

/**
 * Parameters for operation createPet
 *
 * @typedef CreatePetParams
 * @property {Pet} body
 */

/**
 * Parameters for operation uploadPetPhoto
 *
 * @typedef UploadPetPhotoParams
 * @property {string} id
 * @property {{
 *     file: Blob;
 *     caption?: string;
 *   }} body
 */

const GET_PET_PATH = '/pets/{id}';
const UPDATE_PET_PATH = '/pets/{id}';
const DELETE_PET_PATH = '/pets/{id}';
const CREATE_PET_PATH = '/pets';
const UPLOAD_PET_PHOTO_PATH = '/pets/{id}/photo';

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
   * @param {UpdatePetParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<UpdatePetApiResponse>}
   */
  async updatePet(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, UPDATE_PET_PATH, 'put');
    rb.path('id', params.id, {});
    rb.body(params.body, 'application/json');

    return /** @type {UpdatePetApiResponse} */ (
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
   * @param {UploadPetPhotoParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<UploadPetPhotoApiResponse>}
   */
  async uploadPetPhoto(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, UPLOAD_PET_PHOTO_PATH, 'post');
    rb.path('id', params.id, {});
    rb.body(params.body, 'multipart/form-data');

    return /** @type {UploadPetPhotoApiResponse} */ (
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
