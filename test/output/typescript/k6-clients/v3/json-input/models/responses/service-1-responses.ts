import { JSONValue } from 'k6';
import { Response } from 'k6/http';

import type { Thing } from '../thing';

type ListThingsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation listThings
 */
export type ListThingsApiResponse<TStatus extends ListThingsStatusCodes = ListThingsStatusCodes> = (
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

