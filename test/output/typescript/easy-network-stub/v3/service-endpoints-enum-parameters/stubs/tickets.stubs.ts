import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { Ticket } from '../models/ticket';
import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const listTicketsResponder = getStubResponder<{
    200: (Ticket)[];
    401: never;
    403: never;
    500: never;
  }>();

const createTicketResponder = getStubResponder<{
    201: Ticket;
    401: never;
    403: never;
    500: never;
  }>();

const updateTicketResponder = getStubResponder<{
    204: never;
    401: never;
    403: never;
    500: never;
  }>();

export class TicketsStubs extends EasyNetworkStubBase {
  private static readonly LIST_TICKETS_PATH = 'tickets?{statuses:Status[]}&{priorities?:Priority[]}&{priority?:Priority}&{ids?:string[]}' as const;
  private static readonly CREATE_TICKET_PATH = 'tickets' as const;
  private static readonly UPDATE_TICKET_PATH = 'tickets/{id:string}' as const;

  private readonly _listTicketsRequests: (StubRequestInfo<typeof TicketsStubs.LIST_TICKETS_PATH, unknown>)[] = [];
  private readonly _createTicketRequests: (StubRequestInfo<typeof TicketsStubs.CREATE_TICKET_PATH, Ticket>)[] = [];
  private readonly _updateTicketRequests: (StubRequestInfo<typeof TicketsStubs.UPDATE_TICKET_PATH, Ticket>)[] = [];

  public get listTicketsRequests(): readonly (StubRequestInfo<typeof TicketsStubs.LIST_TICKETS_PATH, unknown>)[] {
    return this._listTicketsRequests;
  }
  public get createTicketRequests(): readonly (StubRequestInfo<typeof TicketsStubs.CREATE_TICKET_PATH, Ticket>)[] {
    return this._createTicketRequests;
  }
  public get updateTicketRequests(): readonly (StubRequestInfo<typeof TicketsStubs.UPDATE_TICKET_PATH, Ticket>)[] {
    return this._updateTicketRequests;
  }

  public stubListTickets(response: StrictRouteResponseCallback<
      unknown,
      typeof TicketsStubs.LIST_TICKETS_PATH,
      typeof listTicketsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      TicketsStubs.LIST_TICKETS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._listTicketsRequests.push(request);
        }
        throw await response(listTicketsResponder, request);
      }
    );
    return this;
  }

  public stubCreateTicket(response: StrictRouteResponseCallback<
      Ticket,
      typeof TicketsStubs.CREATE_TICKET_PATH,
      typeof createTicketResponder
    >): this {
    this.stubWrapper.stub2<Ticket>()(
      'POST',
      TicketsStubs.CREATE_TICKET_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._createTicketRequests.push(request);
        }
        throw await response(createTicketResponder, request);
      }
    );
    return this;
  }

  public stubUpdateTicket(response: StrictRouteResponseCallback<
      Ticket,
      typeof TicketsStubs.UPDATE_TICKET_PATH,
      typeof updateTicketResponder
    >): this {
    this.stubWrapper.stub2<Ticket>()(
      'PUT',
      TicketsStubs.UPDATE_TICKET_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._updateTicketRequests.push(request);
        }
        throw await response(updateTicketResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._listTicketsRequests.length = 0;
    this._createTicketRequests.length = 0;
    this._updateTicketRequests.length = 0;
    super.reset();
  }
}
