import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

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
    | ((HttpResponse<(Resource)[]>) & ({
          status: 200;
          ok: true;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 401;
          ok: false;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 403;
          ok: false;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 500;
          ok: false;
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
    | ((HttpResponse<(Resource)[]>) & ({
          status: 200;
          ok: true;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 401;
          ok: false;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 403;
          ok: false;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 500;
          ok: false;
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
    | ((HttpResponse<boolean>) & ({
          status: 200;
          ok: true;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 401;
          ok: false;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 403;
          ok: false;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 500;
          ok: false;
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
    | ((HttpResponse<unknown>) & ({
          status: 204;
          ok: true;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 401;
          ok: false;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 403;
          ok: false;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 500;
          ok: false;
        }))) & ({
      status: TStatus;
    });

