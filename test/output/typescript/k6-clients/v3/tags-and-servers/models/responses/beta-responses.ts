import { JSONValue } from 'k6';
import { Response } from 'k6/http';

type TwoTagsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation twoTags
 */
export type TwoTagsApiResponse<TStatus extends TwoTagsStatusCodes = TwoTagsStatusCodes> = (
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

