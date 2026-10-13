import { JSONValue } from 'k6';
import { Response } from 'k6/http';

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
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): Thing;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 201;
          json(): OtherThing;
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

type SuccessAndDefaultStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation successAndDefault
 */
export type SuccessAndDefaultApiResponse<TStatus extends SuccessAndDefaultStatusCodes = SuccessAndDefaultStatusCodes> = (
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): Thing;
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

type OnlyDefaultStatusCodes = (401) | (403) | (500);
/**
 * Response model for operation onlyDefault
 */
export type OnlyDefaultApiResponse<TStatus extends OnlyDefaultStatusCodes = OnlyDefaultStatusCodes> = (((Omit<Response, 'json'>) & ({
          status: 401;
          json(): never;
          json(selector: string): JSONValue;
        })) | ((Omit<Response, 'json'>) & ({
          status: 403;
          json(): never;
          json(selector: string): JSONValue;
        })) | ((Omit<Response, 'json'>) & ({
          status: 500;
          json(): never;
          json(selector: string): JSONValue;
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

type EmptyBody200StatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation emptyBody200
 */
export type EmptyBody200ApiResponse<TStatus extends EmptyBody200StatusCodes = EmptyBody200StatusCodes> = (
    | ((Omit<Response, 'json'>) & ({
          status: 200;
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

type RangeCodesStatusCodes = (401) | (403) | (500);
/**
 * Response model for operation rangeCodes
 */
export type RangeCodesApiResponse<TStatus extends RangeCodesStatusCodes = RangeCodesStatusCodes> = (((Omit<Response, 'json'>) & ({
          status: 401;
          json(): never;
          json(selector: string): JSONValue;
        })) | ((Omit<Response, 'json'>) & ({
          status: 403;
          json(): never;
          json(selector: string): JSONValue;
        })) | ((Omit<Response, 'json'>) & ({
          status: 500;
          json(): never;
          json(selector: string): JSONValue;
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
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): Thing;
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
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): Thing;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 400;
          json(): Error;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 401;
          json(): Error;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 403;
          json(): never;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 404;
          json(): Error;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 500;
          json(): Error;
          json(selector: string): JSONValue;
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
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): Thing;
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

type PrimitiveResponseStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation primitiveResponse
 */
export type PrimitiveResponseApiResponse<TStatus extends PrimitiveResponseStatusCodes = PrimitiveResponseStatusCodes> = (
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): string;
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

type ArrayResponseStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation arrayResponse
 */
export type ArrayResponseApiResponse<TStatus extends ArrayResponseStatusCodes = ArrayResponseStatusCodes> = (
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): (Thing)[];
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

type RefResponseStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation refResponse
 */
export type RefResponseApiResponse<TStatus extends RefResponseStatusCodes = RefResponseStatusCodes> = (
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): Thing;
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

