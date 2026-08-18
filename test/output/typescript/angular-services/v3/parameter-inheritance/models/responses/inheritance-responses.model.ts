import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

type InheritsParamsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation inheritsParams
 */
export type InheritsParamsApiResponse<TStatus extends InheritsParamsStatusCodes = InheritsParamsStatusCodes> = (
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

type InheritsAndAddsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation inheritsAndAdds
 */
export type InheritsAndAddsApiResponse<TStatus extends InheritsAndAddsStatusCodes = InheritsAndAddsStatusCodes> = (
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

type OverridesParamStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation overridesParam
 */
export type OverridesParamApiResponse<TStatus extends OverridesParamStatusCodes = OverridesParamStatusCodes> = (
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

type RefParamStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation refParam
 */
export type RefParamApiResponse<TStatus extends RefParamStatusCodes = RefParamStatusCodes> = (
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

