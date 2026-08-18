import { UrlBuilder } from '../utils/fetch-client.utils';

import type { Permission } from '../models/permission';
import type { Resource } from '../models/resource';
import type { FetchClientOptions, TypedResponse } from '../utils/fetch-client.utils';

export const RESOURCES_CLIENT_DEFAULT_OPTIONS: FetchClientOptions = {};

export class ResourcesClient {
  /**
   * Options for the fetch client.
   */
  public options: FetchClientOptions;

  constructor(options?: Partial<FetchClientOptions>) {
    this.options = { ...RESOURCES_CLIENT_DEFAULT_OPTIONS, ...options };
  }

  /**
   * @param params Parameters for the endpoint.
   */
  public listResources(params: {
      permission: Permission;
      limit?: number;
      tags?: (string)[];
      xTenant: string;
    }): Promise<TypedResponse<(Resource)[]>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/resources')
      .withQueryParam('permission', params.permission)
      .withQueryParam('limit', params.limit)
      .withQueryParam('tags', params.tags)
      .build();
    const headers = { ...this.options.headers };
    if (params && params.xTenant !== undefined) {
      headers['X-Tenant'] = String(params.xTenant);
    }
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<(Resource)[]>>;
  }

  /**
   * @param params Parameters for the endpoint.
   */
  public getPermittedResources(params: {
      resourceType: string;
      permission?: Permission;
      limit?: number;
    }): Promise<TypedResponse<(Resource)[]>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/resources/{resourceType}')
      .withPathParam('resourceType', params.resourceType)
      .withQueryParam('permission', params.permission)
      .withQueryParam('limit', params.limit)
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<(Resource)[]>>;
  }

  /**
   * @param params Parameters for the endpoint.
   */
  public checkResourcePermission(params: {
      resourceType: string;
      resourceId: string;
      permission: Permission;
    }): Promise<TypedResponse<boolean>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/resources/{resourceType}/{resourceId}/{permission}')
      .withPathParam('resourceType', params.resourceType)
      .withPathParam('resourceId', params.resourceId)
      .withPathParam('permission', params.permission)
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<boolean>>;
  }

  /**
   * @param params Parameters for the endpoint.
   * @param body Body for the endpoint.
   */
  public grantResourcePermission(params: {
      resourceType: string;
      resourceId: string;
      permission: Permission;
      notify?: boolean;
    }, body: Resource): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/resources/{resourceType}/{resourceId}/{permission}')
      .withPathParam('resourceType', params.resourceType)
      .withPathParam('resourceId', params.resourceId)
      .withPathParam('permission', params.permission)
      .withQueryParam('notify', params.notify)
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(body),
    });
    Object.defineProperty(response, 'isVoidResponse', { value: true });
    return response as unknown as Promise<TypedResponse<void>>;
  }
}
