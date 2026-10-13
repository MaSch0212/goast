import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

import type { Error } from '../error';
import type { OtherThing } from '../other-thing';
import type { Thing } from '../thing';

type TwoSuccessCodesStatusCodes =
  | (200)
  | (201)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation twoSuccessCodes
 */
export type TwoSuccessCodesApiResponse<TStatus extends TwoSuccessCodesStatusCodes = TwoSuccessCodesStatusCodes> = (
    | ((HttpResponse<Thing>) & ({
          status: 200;
          ok: true;
        }))
    | ((HttpResponse<OtherThing>) & ({
          status: 201;
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

type SuccessAndDefaultStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation successAndDefault
 */
export type SuccessAndDefaultApiResponse<TStatus extends SuccessAndDefaultStatusCodes = SuccessAndDefaultStatusCodes> = (
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

type OnlyDefaultStatusCodes = (401) | (403) | (500);
/**
 * Response model for operation onlyDefault
 */
export type OnlyDefaultApiResponse<TStatus extends OnlyDefaultStatusCodes = OnlyDefaultStatusCodes> = (((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 401;
          ok: false;
        })) | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 403;
          ok: false;
        })) | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 500;
          ok: false;
        }))) & ({
      status: TStatus;
    });

type NoContentStatusCodes =
  | (204)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation noContent
 */
export type NoContentApiResponse<TStatus extends NoContentStatusCodes = NoContentStatusCodes> = (
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

type EmptyBody200StatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation emptyBody200
 */
export type EmptyBody200ApiResponse<TStatus extends EmptyBody200StatusCodes = EmptyBody200StatusCodes> = (
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

type RangeCodesStatusCodes = (401) | (403) | (500);
/**
 * Response model for operation rangeCodes
 */
export type RangeCodesApiResponse<TStatus extends RangeCodesStatusCodes = RangeCodesStatusCodes> = (((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 401;
          ok: false;
        })) | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 403;
          ok: false;
        })) | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 500;
          ok: false;
        }))) & ({
      status: TStatus;
    });

type MixedExactAndRangeStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation mixedExactAndRange
 */
export type MixedExactAndRangeApiResponse<TStatus extends MixedExactAndRangeStatusCodes = MixedExactAndRangeStatusCodes> = (
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

type ErrorCodesStatusCodes =
  | (200)
  | (400)
  | (401)
  | (403)
  | (404)
  | (500);
/**
 * Response model for operation errorCodes
 */
export type ErrorCodesApiResponse<TStatus extends ErrorCodesStatusCodes = ErrorCodesStatusCodes> = (
    | ((HttpResponse<Thing>) & ({
          status: 200;
          ok: true;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (Error) | (null);
          status: 400;
          ok: false;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (Error) | (null);
          status: 401;
          ok: false;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 403;
          ok: false;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (Error) | (null);
          status: 404;
          ok: false;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (Error) | (null);
          status: 500;
          ok: false;
        }))) & ({
      status: TStatus;
    });

type MultiContentResponseStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation multiContentResponse
 */
export type MultiContentResponseApiResponse<TStatus extends MultiContentResponseStatusCodes = MultiContentResponseStatusCodes> = (
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

type PrimitiveResponseStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation primitiveResponse
 */
export type PrimitiveResponseApiResponse<TStatus extends PrimitiveResponseStatusCodes = PrimitiveResponseStatusCodes> = (
    | ((HttpResponse<string>) & ({
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

type ArrayResponseStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation arrayResponse
 */
export type ArrayResponseApiResponse<TStatus extends ArrayResponseStatusCodes = ArrayResponseStatusCodes> = (
    | ((HttpResponse<(Thing)[]>) & ({
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

type RefResponseStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation refResponse
 */
export type RefResponseApiResponse<TStatus extends RefResponseStatusCodes = RefResponseStatusCodes> = (
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

