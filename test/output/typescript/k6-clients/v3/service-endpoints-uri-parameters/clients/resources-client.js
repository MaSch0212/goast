// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { Permission } from '../models/permission';
 * @import { Resource } from '../models/resource';
 * @import { CheckResourcePermissionApiResponse, GetPermittedResourcesApiResponse, GrantResourcePermissionApiResponse, ListResourcesApiResponse } from '../models/responses/resources-responses';
 */

/**
 * Parameters for operation listResources
 *
 * @typedef ListResourcesParams
 * @property {Permission} permission
 * @property {number} [limit]
 * @property {(string)[]} [tags]
 * @property {string} xTenant
 */

/**
 * Parameters for operation getPermittedResources
 *
 * @typedef GetPermittedResourcesParams
 * @property {string} resourceType
 * @property {Permission} [permission]
 * @property {number} [limit]
 */

/**
 * Parameters for operation checkResourcePermission
 *
 * @typedef CheckResourcePermissionParams
 * @property {string} resourceType
 * @property {string} resourceId
 * @property {Permission} permission
 */

/**
 * Parameters for operation grantResourcePermission
 *
 * @typedef GrantResourcePermissionParams
 * @property {string} resourceType
 * @property {string} resourceId
 * @property {Permission} permission
 * @property {boolean} [notify]
 * @property {Resource} body
 */

const LIST_RESOURCES_PATH = '/resources';
const GET_PERMITTED_RESOURCES_PATH = '/resources/{resourceType}';
const CHECK_RESOURCE_PERMISSION_PATH = '/resources/{resourceType}/{resourceId}/{permission}';
const GRANT_RESOURCE_PERMISSION_PATH = '/resources/{resourceType}/{resourceId}/{permission}';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class ResourcesClient {
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
   * @param {ListResourcesParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<ListResourcesApiResponse>}
   */
  async listResources(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, LIST_RESOURCES_PATH, 'get');
    rb.query('permission', params.permission, {});
    rb.query('limit', params.limit, {});
    rb.query('tags', params.tags, {});
    rb.header('X-Tenant', params.xTenant, {});

    return /** @type {ListResourcesApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {GetPermittedResourcesParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<GetPermittedResourcesApiResponse>}
   */
  async getPermittedResources(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, GET_PERMITTED_RESOURCES_PATH, 'get');
    rb.path('resourceType', params.resourceType, {});
    rb.query('permission', params.permission, {});
    rb.query('limit', params.limit, {});

    return /** @type {GetPermittedResourcesApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {CheckResourcePermissionParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<CheckResourcePermissionApiResponse>}
   */
  async checkResourcePermission(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, CHECK_RESOURCE_PERMISSION_PATH, 'get');
    rb.path('resourceType', params.resourceType, {});
    rb.path('resourceId', params.resourceId, {});
    rb.path('permission', params.permission, {});

    return /** @type {CheckResourcePermissionApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {GrantResourcePermissionParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<GrantResourcePermissionApiResponse>}
   */
  async grantResourcePermission(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, GRANT_RESOURCE_PERMISSION_PATH, 'put');
    rb.path('resourceType', params.resourceType, {});
    rb.path('resourceId', params.resourceId, {});
    rb.path('permission', params.permission, {});
    rb.query('notify', params.notify, {});
    rb.body(params.body, 'application/json');

    return /** @type {GrantResourcePermissionApiResponse} */ (
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
