import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { Permission } from '../models/permission';
import type { Resource } from '../models/resource';
import type { CheckResourcePermissionApiResponse, GetPermittedResourcesApiResponse, GrantResourcePermissionApiResponse, ListResourcesApiResponse } from '../models/responses/resources-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation listResources
 */
type ListResourcesParams = {
    permission: Permission;
    limit?: number;
    tags?: (string)[];
    xTenant: string;
  };

/**
 * Parameters for operation getPermittedResources
 */
type GetPermittedResourcesParams = {
    resourceType: string;
    permission?: Permission;
    limit?: number;
  };

/**
 * Parameters for operation checkResourcePermission
 */
type CheckResourcePermissionParams = {
    resourceType: string;
    resourceId: string;
    permission: Permission;
  };

/**
 * Parameters for operation grantResourcePermission
 */
type GrantResourcePermissionParams = {
    resourceType: string;
    resourceId: string;
    permission: Permission;
    notify?: boolean;
    body: Resource;
  };

@Injectable()
export class ResourcesService extends ApiBaseService {
  private static readonly LIST_RESOURCES_PATH = '/resources';
  private static readonly GET_PERMITTED_RESOURCES_PATH = '/resources/{resourceType}';
  private static readonly CHECK_RESOURCE_PERMISSION_PATH = '/resources/{resourceType}/{resourceId}/{permission}';
  private static readonly GRANT_RESOURCE_PERMISSION_PATH = '/resources/{resourceType}/{resourceId}/{permission}';

  public listResources(params: ListResourcesParams, context?: HttpContext): AbortablePromise<ListResourcesApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ResourcesService.LIST_RESOURCES_PATH, 'get');
    rb.query('permission', params.permission, {});
    rb.query('limit', params.limit, {});
    rb.query('tags', params.tags, {});
    rb.header('X-Tenant', params.xTenant, {});

    return waitForResponse<ListResourcesApiResponse>(
      this.http.request(rb.build({
        responseType: 'json',
        accept: 'application/json',
        context,
      })),
      {
        errorResponseTypes: {
          401: 'text',
          403: 'text',
          500: 'text',
        }
      }
    )
  }

  public getPermittedResources(params: GetPermittedResourcesParams, context?: HttpContext): AbortablePromise<GetPermittedResourcesApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ResourcesService.GET_PERMITTED_RESOURCES_PATH, 'get');
    rb.path('resourceType', params.resourceType, {});
    rb.query('permission', params.permission, {});
    rb.query('limit', params.limit, {});

    return waitForResponse<GetPermittedResourcesApiResponse>(
      this.http.request(rb.build({
        responseType: 'json',
        accept: 'application/json',
        context,
      })),
      {
        errorResponseTypes: {
          401: 'text',
          403: 'text',
          500: 'text',
        }
      }
    )
  }

  public checkResourcePermission(params: CheckResourcePermissionParams, context?: HttpContext): AbortablePromise<CheckResourcePermissionApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ResourcesService.CHECK_RESOURCE_PERMISSION_PATH, 'get');
    rb.path('resourceType', params.resourceType, {});
    rb.path('resourceId', params.resourceId, {});
    rb.path('permission', params.permission, {});

    return waitForResponse<CheckResourcePermissionApiResponse>(
      this.http.request(rb.build({
        responseType: 'json',
        accept: 'application/json',
        context,
      })),
      {
        errorResponseTypes: {
          401: 'text',
          403: 'text',
          500: 'text',
        }
      }
    )
  }

  public grantResourcePermission(params: GrantResourcePermissionParams, context?: HttpContext): AbortablePromise<GrantResourcePermissionApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ResourcesService.GRANT_RESOURCE_PERMISSION_PATH, 'put');
    rb.path('resourceType', params.resourceType, {});
    rb.path('resourceId', params.resourceId, {});
    rb.path('permission', params.permission, {});
    rb.query('notify', params.notify, {});
    rb.body(params.body, 'application/json');

    return waitForResponse<GrantResourcePermissionApiResponse>(
      this.http.request(rb.build({
        responseType: 'text',
        accept: '*/*',
        context,
      })),
      {
        errorResponseTypes: {
          401: 'text',
          403: 'text',
          500: 'text',
        }
      }
    )
  }
}
