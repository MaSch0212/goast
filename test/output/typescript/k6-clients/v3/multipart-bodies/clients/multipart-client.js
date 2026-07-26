// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { Payload } from '../models/payload';
 * @import { FileAndFieldsApiResponse, MultipleFilesApiResponse, NestedObjectPartApiResponse, OptionalFileApiResponse, RefPartApiResponse, SingleFileApiResponse, WithEncodingApiResponse } from '../models/responses/multipart-responses';
 */

/**
 * Parameters for operation singleFile
 *
 * @typedef SingleFileParams
 * @property {{
 *     file: Blob;
 *   }} body
 */

/**
 * Parameters for operation multipleFiles
 *
 * @typedef MultipleFilesParams
 * @property {{
 *     files?: (Blob)[];
 *   }} body
 */

/**
 * Parameters for operation fileAndFields
 *
 * @typedef FileAndFieldsParams
 * @property {{
 *     file?: Blob;
 *     label?: string;
 *     quantity?: number;
 *     active?: boolean;
 *   }} body
 */

/**
 * Parameters for operation nestedObjectPart
 *
 * @typedef NestedObjectPartParams
 * @property {{
 *     metadata?: {
 *       author?: string;
 *       version?: number;
 *     };
 *   }} body
 */

/**
 * Parameters for operation refPart
 *
 * @typedef RefPartParams
 * @property {{
 *     payload?: Payload;
 *   }} body
 */

/**
 * Parameters for operation withEncoding
 *
 * @typedef WithEncodingParams
 * @property {{
 *     file?: Blob;
 *     label?: string;
 *     quantity?: number;
 *     active?: boolean;
 *   }} body
 */

/**
 * Parameters for operation optionalFile
 *
 * @typedef OptionalFileParams
 * @property {{
 *     file?: Blob;
 *   }} body
 */

const SINGLE_FILE_PATH = '/file';
const MULTIPLE_FILES_PATH = '/files';
const FILE_AND_FIELDS_PATH = '/mixed';
const NESTED_OBJECT_PART_PATH = '/nested';
const REF_PART_PATH = '/ref-part';
const WITH_ENCODING_PATH = '/encoded';
const OPTIONAL_FILE_PATH = '/optional-file';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class MultipartClient {
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
   * @param {SingleFileParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<SingleFileApiResponse>}
   */
  async singleFile(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, SINGLE_FILE_PATH, 'post');
    rb.body(params.body, 'multipart/form-data');

    return /** @type {SingleFileApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {MultipleFilesParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<MultipleFilesApiResponse>}
   */
  async multipleFiles(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, MULTIPLE_FILES_PATH, 'post');
    rb.body(params.body, 'multipart/form-data');

    return /** @type {MultipleFilesApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {FileAndFieldsParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<FileAndFieldsApiResponse>}
   */
  async fileAndFields(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, FILE_AND_FIELDS_PATH, 'post');
    rb.body(params.body, 'multipart/form-data');

    return /** @type {FileAndFieldsApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {NestedObjectPartParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<NestedObjectPartApiResponse>}
   */
  async nestedObjectPart(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, NESTED_OBJECT_PART_PATH, 'post');
    rb.body(params.body, 'multipart/form-data');

    return /** @type {NestedObjectPartApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {RefPartParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<RefPartApiResponse>}
   */
  async refPart(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, REF_PART_PATH, 'post');
    rb.body(params.body, 'multipart/form-data');

    return /** @type {RefPartApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {WithEncodingParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<WithEncodingApiResponse>}
   */
  async withEncoding(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, WITH_ENCODING_PATH, 'post');
    rb.body(params.body, 'multipart/form-data');

    return /** @type {WithEncodingApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {OptionalFileParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<OptionalFileApiResponse>}
   */
  async optionalFile(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, OPTIONAL_FILE_PATH, 'post');
    rb.body(params.body, 'multipart/form-data');

    return /** @type {OptionalFileApiResponse} */ (
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
