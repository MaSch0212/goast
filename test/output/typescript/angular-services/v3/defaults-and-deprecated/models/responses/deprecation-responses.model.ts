import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

type DeprecatedOpStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation deprecatedOp
 *
 * @deprecated
 */
export type DeprecatedOpApiResponse<TStatus extends DeprecatedOpStatusCodes = DeprecatedOpStatusCodes> = (
    | ((HttpResponse<unknown>) & ({
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

type DeprecatedOpNoDescStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation deprecatedOpNoDesc
 *
 * @deprecated
 */
export type DeprecatedOpNoDescApiResponse<TStatus extends DeprecatedOpNoDescStatusCodes = DeprecatedOpNoDescStatusCodes> = (
    | ((HttpResponse<unknown>) & ({
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

type DeprecatedParamsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation deprecatedParams
 */
export type DeprecatedParamsApiResponse<TStatus extends DeprecatedParamsStatusCodes = DeprecatedParamsStatusCodes> = (
    | ((HttpResponse<unknown>) & ({
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

