import { JSONValue } from 'k6';
import { Response } from 'k6/http';

import type { Resource } from '../resource';

type ListResourcesStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation listResources
 */
export type ListResourcesApiResponse<TStatus extends ListResourcesStatusCodes = ListResourcesStatusCodes> = (
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): (Resource)[];
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 401;
          json(): never;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 403;
          json(): never;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 500;
          json(): never;
          json(selector: string): JSONValue;
        }))) & ({
      status: TStatus;
    });

type GetPermittedResourcesStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation getPermittedResources
 */
export type GetPermittedResourcesApiResponse<TStatus extends GetPermittedResourcesStatusCodes = GetPermittedResourcesStatusCodes> = (
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): (Resource)[];
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 401;
          json(): never;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 403;
          json(): never;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 500;
          json(): never;
          json(selector: string): JSONValue;
        }))) & ({
      status: TStatus;
    });

type CheckResourcePermissionStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation checkResourcePermission
 */
export type CheckResourcePermissionApiResponse<TStatus extends CheckResourcePermissionStatusCodes = CheckResourcePermissionStatusCodes> = (
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): boolean;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 401;
          json(): never;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 403;
          json(): never;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 500;
          json(): never;
          json(selector: string): JSONValue;
        }))) & ({
      status: TStatus;
    });

type GrantResourcePermissionStatusCodes =
  | (204)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation grantResourcePermission
 */
export type GrantResourcePermissionApiResponse<TStatus extends GrantResourcePermissionStatusCodes = GrantResourcePermissionStatusCodes> = (
    | ((Omit<Response, 'json'>) & ({
          status: 204;
          json(): never;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 401;
          json(): never;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 403;
          json(): never;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 500;
          json(): never;
          json(selector: string): JSONValue;
        }))) & ({
      status: TStatus;
    });

