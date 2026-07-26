import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

type TwoPathParamsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation twoPathParams
 */
export type TwoPathParamsApiResponse<TStatus extends TwoPathParamsStatusCodes = TwoPathParamsStatusCodes> = (
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

type QueryParamsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation queryParams
 */
export type QueryParamsApiResponse<TStatus extends QueryParamsStatusCodes = QueryParamsStatusCodes> = (
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

type HeaderParamsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation headerParams
 */
export type HeaderParamsApiResponse<TStatus extends HeaderParamsStatusCodes = HeaderParamsStatusCodes> = (
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

type CookieParamsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation cookieParams
 */
export type CookieParamsApiResponse<TStatus extends CookieParamsStatusCodes = CookieParamsStatusCodes> = (
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

type MixedParamsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation mixedParams
 */
export type MixedParamsApiResponse<TStatus extends MixedParamsStatusCodes = MixedParamsStatusCodes> = (
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

type DescribedParamsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation describedParams
 */
export type DescribedParamsApiResponse<TStatus extends DescribedParamsStatusCodes = DescribedParamsStatusCodes> = (
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

type AllowEmptyValueParamStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation allowEmptyValueParam
 */
export type AllowEmptyValueParamApiResponse<TStatus extends AllowEmptyValueParamStatusCodes = AllowEmptyValueParamStatusCodes> = (
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

type ReservedCharParamStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation reservedCharParam
 */
export type ReservedCharParamApiResponse<TStatus extends ReservedCharParamStatusCodes = ReservedCharParamStatusCodes> = (
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

