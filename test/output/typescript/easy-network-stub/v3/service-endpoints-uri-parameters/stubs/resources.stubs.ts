import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { Resource } from '../models/resource';
import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const listResourcesResponder = getStubResponder<{
    200: (Resource)[];
    401: never;
    403: never;
    500: never;
  }>();

const getPermittedResourcesResponder = getStubResponder<{
    200: (Resource)[];
    401: never;
    403: never;
    500: never;
  }>();

const checkResourcePermissionResponder = getStubResponder<{
    200: boolean;
    401: never;
    403: never;
    500: never;
  }>();

const grantResourcePermissionResponder = getStubResponder<{
    204: never;
    401: never;
    403: never;
    500: never;
  }>();

export class ResourcesStubs extends EasyNetworkStubBase {
  private static readonly LIST_RESOURCES_PATH = 'resources?{permission:Permission}&{limit?:number}&{tags?:string[]}' as const;
  private static readonly GET_PERMITTED_RESOURCES_PATH = 'resources/{resourceType:string}?{permission?:Permission}&{limit?:number}' as const;
  private static readonly CHECK_RESOURCE_PERMISSION_PATH = 'resources/{resourceType:string}/{resourceId:string}/{permission:Permission}' as const;
  private static readonly GRANT_RESOURCE_PERMISSION_PATH = 'resources/{resourceType:string}/{resourceId:string}/{permission:Permission}?{notify?:boolean}' as const;

  private readonly _listResourcesRequests: (StubRequestInfo<typeof ResourcesStubs.LIST_RESOURCES_PATH, unknown>)[] = [];
  private readonly _getPermittedResourcesRequests: (StubRequestInfo<typeof ResourcesStubs.GET_PERMITTED_RESOURCES_PATH, unknown>)[] = [];
  private readonly _checkResourcePermissionRequests: (StubRequestInfo<typeof ResourcesStubs.CHECK_RESOURCE_PERMISSION_PATH, unknown>)[] = [];
  private readonly _grantResourcePermissionRequests: (StubRequestInfo<typeof ResourcesStubs.GRANT_RESOURCE_PERMISSION_PATH, Resource>)[] = [];

  public get listResourcesRequests(): readonly (StubRequestInfo<typeof ResourcesStubs.LIST_RESOURCES_PATH, unknown>)[] {
    return this._listResourcesRequests;
  }
  public get getPermittedResourcesRequests(): readonly (StubRequestInfo<typeof ResourcesStubs.GET_PERMITTED_RESOURCES_PATH, unknown>)[] {
    return this._getPermittedResourcesRequests;
  }
  public get checkResourcePermissionRequests(): readonly (StubRequestInfo<typeof ResourcesStubs.CHECK_RESOURCE_PERMISSION_PATH, unknown>)[] {
    return this._checkResourcePermissionRequests;
  }
  public get grantResourcePermissionRequests(): readonly (StubRequestInfo<typeof ResourcesStubs.GRANT_RESOURCE_PERMISSION_PATH, Resource>)[] {
    return this._grantResourcePermissionRequests;
  }

  public stubListResources(response: StrictRouteResponseCallback<
      unknown,
      typeof ResourcesStubs.LIST_RESOURCES_PATH,
      typeof listResourcesResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ResourcesStubs.LIST_RESOURCES_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._listResourcesRequests.push(request);
        }
        throw await response(listResourcesResponder, request);
      }
    );
    return this;
  }

  public stubGetPermittedResources(response: StrictRouteResponseCallback<
      unknown,
      typeof ResourcesStubs.GET_PERMITTED_RESOURCES_PATH,
      typeof getPermittedResourcesResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ResourcesStubs.GET_PERMITTED_RESOURCES_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._getPermittedResourcesRequests.push(request);
        }
        throw await response(getPermittedResourcesResponder, request);
      }
    );
    return this;
  }

  public stubCheckResourcePermission(response: StrictRouteResponseCallback<
      unknown,
      typeof ResourcesStubs.CHECK_RESOURCE_PERMISSION_PATH,
      typeof checkResourcePermissionResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ResourcesStubs.CHECK_RESOURCE_PERMISSION_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._checkResourcePermissionRequests.push(request);
        }
        throw await response(checkResourcePermissionResponder, request);
      }
    );
    return this;
  }

  public stubGrantResourcePermission(response: StrictRouteResponseCallback<
      Resource,
      typeof ResourcesStubs.GRANT_RESOURCE_PERMISSION_PATH,
      typeof grantResourcePermissionResponder
    >): this {
    this.stubWrapper.stub2<Resource>()(
      'PUT',
      ResourcesStubs.GRANT_RESOURCE_PERMISSION_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._grantResourcePermissionRequests.push(request);
        }
        throw await response(grantResourcePermissionResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._listResourcesRequests.length = 0;
    this._getPermittedResourcesRequests.length = 0;
    this._checkResourcePermissionRequests.length = 0;
    this._grantResourcePermissionRequests.length = 0;
    super.reset();
  }
}
