import { JSONValue } from 'k6';
import { Response } from 'k6/http';

type TagWithSpaceStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation tagWithSpace
 */
export type TagWithSpaceApiResponse<TStatus extends TagWithSpaceStatusCodes = TagWithSpaceStatusCodes> = (
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

