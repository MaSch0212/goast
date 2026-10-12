import { JSONValue } from 'k6';
import { Response } from 'k6/http';

import type { Ticket } from '../ticket';

type ListTicketsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation listTickets
 */
export type ListTicketsApiResponse<TStatus extends ListTicketsStatusCodes = ListTicketsStatusCodes> = (
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): (Ticket)[];
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

type CreateTicketStatusCodes =
  | (201)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation createTicket
 */
export type CreateTicketApiResponse<TStatus extends CreateTicketStatusCodes = CreateTicketStatusCodes> = (
    | ((Omit<Response, 'json'>) & ({
          status: 201;
          json(): Ticket;
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

type UpdateTicketStatusCodes =
  | (204)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation updateTicket
 */
export type UpdateTicketApiResponse<TStatus extends UpdateTicketStatusCodes = UpdateTicketStatusCodes> = (
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

