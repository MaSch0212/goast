import { JSONValue } from 'k6';
import { Response } from 'k6/http';

import type { Error } from '../error';
import type { Widget } from '../widget';

type GetWidgetStatusCodes =
  | (200)
  | (400)
  | (401)
  | (403)
  | (404)
  | (500);
/**
 * Response model for operation getWidget
 */
export type GetWidgetApiResponse<TStatus extends GetWidgetStatusCodes = GetWidgetStatusCodes> = (
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): Widget;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 400;
          json(): Error;
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

