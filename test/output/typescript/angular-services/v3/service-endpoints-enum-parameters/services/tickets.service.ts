import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { Priority } from '../models/priority';
import type { CreateTicketApiResponse, ListTicketsApiResponse, UpdateTicketApiResponse } from '../models/responses/tickets-responses.model';
import type { Status } from '../models/status';
import type { Ticket } from '../models/ticket';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation listTickets
 */
type ListTicketsParams = {
    statuses: (Status)[];
    priorities?: (Priority)[];
    priority?: Priority;
    ids?: (string)[];
    xStatuses?: (Status)[];
  };

/**
 * Parameters for operation createTicket
 */
type CreateTicketParams = {
    body?: Ticket;
  };

/**
 * Parameters for operation updateTicket
 */
type UpdateTicketParams = {
    id: string;
    body: Ticket;
  };

@Injectable()
export class TicketsService extends ApiBaseService {
  private static readonly LIST_TICKETS_PATH = '/tickets';
  private static readonly CREATE_TICKET_PATH = '/tickets';
  private static readonly UPDATE_TICKET_PATH = '/tickets/{id}';

  public listTickets(params: ListTicketsParams, context?: HttpContext): AbortablePromise<ListTicketsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, TicketsService.LIST_TICKETS_PATH, 'get');
    rb.query('statuses', params.statuses, {});
    rb.query('priorities', params.priorities, {});
    rb.query('priority', params.priority, {});
    rb.query('ids', params.ids, {});
    rb.header('X-Statuses', params.xStatuses, {});

    return waitForResponse<ListTicketsApiResponse>(
      this.http.request(rb.build({
        responseType: 'json',
        accept: 'application/json',
        context,
      })),
      {
        errorResponseTypes: {
          401: 'text',
          403: 'text',
          500: 'text',
        }
      }
    )
  }

  public createTicket(params?: CreateTicketParams, context?: HttpContext): AbortablePromise<CreateTicketApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, TicketsService.CREATE_TICKET_PATH, 'post');
    if (params) {
      rb.body(params.body, 'application/json');
    }

    return waitForResponse<CreateTicketApiResponse>(
      this.http.request(rb.build({
        responseType: 'json',
        accept: 'application/json',
        context,
      })),
      {
        errorResponseTypes: {
          401: 'text',
          403: 'text',
          500: 'text',
        }
      }
    )
  }

  public updateTicket(params: UpdateTicketParams, context?: HttpContext): AbortablePromise<UpdateTicketApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, TicketsService.UPDATE_TICKET_PATH, 'put');
    rb.path('id', params.id, {});
    rb.body(params.body, 'application/json');

    return waitForResponse<UpdateTicketApiResponse>(
      this.http.request(rb.build({
        responseType: 'text',
        accept: '*/*',
        context,
      })),
      {
        errorResponseTypes: {
          401: 'text',
          403: 'text',
          500: 'text',
        }
      }
    )
  }
}
