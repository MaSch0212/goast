import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

import type { Thing } from '../thing';

type SingleHeaderStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation singleHeader
 */
export type SingleHeaderApiResponse<TStatus extends SingleHeaderStatusCodes = SingleHeaderStatusCodes> = (
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

type MultipleHeadersStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation multipleHeaders
 */
export type MultipleHeadersApiResponse<TStatus extends MultipleHeadersStatusCodes = MultipleHeadersStatusCodes> = (
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

type RequiredHeaderStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation requiredHeader
 */
export type RequiredHeaderApiResponse<TStatus extends RequiredHeaderStatusCodes = RequiredHeaderStatusCodes> = (
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

type DeprecatedHeaderStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation deprecatedHeader
 */
export type DeprecatedHeaderApiResponse<TStatus extends DeprecatedHeaderStatusCodes = DeprecatedHeaderStatusCodes> = (
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

type RefHeaderStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation refHeader
 */
export type RefHeaderApiResponse<TStatus extends RefHeaderStatusCodes = RefHeaderStatusCodes> = (
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

type HeadersOnNoContentStatusCodes =
  | (204)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation headersOnNoContent
 */
export type HeadersOnNoContentApiResponse<TStatus extends HeadersOnNoContentStatusCodes = HeadersOnNoContentStatusCodes> = (
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

type HeadersAndBodyStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation headersAndBody
 */
export type HeadersAndBodyApiResponse<TStatus extends HeadersAndBodyStatusCodes = HeadersAndBodyStatusCodes> = (
    | ((HttpResponse<Thing>) & ({
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

