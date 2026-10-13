import { JSONValue } from 'k6';
import { Response } from 'k6/http';

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

type DeprecatedParamsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation deprecatedParams
 */
export type DeprecatedParamsApiResponse<TStatus extends DeprecatedParamsStatusCodes = DeprecatedParamsStatusCodes> = (
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

