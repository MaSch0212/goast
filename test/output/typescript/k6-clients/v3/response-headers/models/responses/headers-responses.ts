import { JSONValue } from 'k6';
import { Response } from 'k6/http';

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

type MultipleHeadersStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation multipleHeaders
 */
export type MultipleHeadersApiResponse<TStatus extends MultipleHeadersStatusCodes = MultipleHeadersStatusCodes> = (
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

type RequiredHeaderStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation requiredHeader
 */
export type RequiredHeaderApiResponse<TStatus extends RequiredHeaderStatusCodes = RequiredHeaderStatusCodes> = (
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

type DeprecatedHeaderStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation deprecatedHeader
 */
export type DeprecatedHeaderApiResponse<TStatus extends DeprecatedHeaderStatusCodes = DeprecatedHeaderStatusCodes> = (
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

type RefHeaderStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation refHeader
 */
export type RefHeaderApiResponse<TStatus extends RefHeaderStatusCodes = RefHeaderStatusCodes> = (
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

type HeadersOnNoContentStatusCodes =
  | (204)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation headersOnNoContent
 */
export type HeadersOnNoContentApiResponse<TStatus extends HeadersOnNoContentStatusCodes = HeadersOnNoContentStatusCodes> = (
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

type HeadersAndBodyStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation headersAndBody
 */
export type HeadersAndBodyApiResponse<TStatus extends HeadersAndBodyStatusCodes = HeadersAndBodyStatusCodes> = (
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

