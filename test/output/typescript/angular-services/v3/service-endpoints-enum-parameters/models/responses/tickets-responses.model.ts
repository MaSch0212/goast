import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

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
    | ((HttpResponse<(Ticket)[]>) & ({
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

type CreateTicketStatusCodes =
  | (201)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation createTicket
 */
export type CreateTicketApiResponse<TStatus extends CreateTicketStatusCodes = CreateTicketStatusCodes> = (
    | ((HttpResponse<Ticket>) & ({
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

type UpdateTicketStatusCodes =
  | (204)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation updateTicket
 */
export type UpdateTicketApiResponse<TStatus extends UpdateTicketStatusCodes = UpdateTicketStatusCodes> = (
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

