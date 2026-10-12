// @ts-check

import { RequestBuilder } from '../utils/request-builder';

/**
 * @import { Params } from 'k6/http';

 * @import { Priority } from '../models/priority';
 * @import { CreateTicketApiResponse, ListTicketsApiResponse, UpdateTicketApiResponse } from '../models/responses/tickets-responses';
 * @import { Status } from '../models/status';
 * @import { Ticket } from '../models/ticket';
 */

/**
 * Parameters for operation listTickets
 *
 * @typedef ListTicketsParams
 * @property {(Status)[]} statuses
 * @property {(Priority)[]} [priorities]
 * @property {Priority} [priority]
 * @property {(string)[]} [ids]
 * @property {(Status)[]} [xStatuses]
 */

/**
 * Parameters for operation createTicket
 *
 * @typedef CreateTicketParams
 * @property {Ticket} [body]
 */

/**
 * Parameters for operation updateTicket
 *
 * @typedef UpdateTicketParams
 * @property {string} id
 * @property {Ticket} body
 */

const LIST_TICKETS_PATH = '/tickets';
const CREATE_TICKET_PATH = '/tickets';
const UPDATE_TICKET_PATH = '/tickets/{id}';

/**
 * @property {string} rootUrl The root URL for this client.
 */
export class TicketsClient {
  /**
   * Creates a new instance of the client.
   *
   * @param {string} rootUrl The root URL for this client.
   * @param {() => Params} [defaultK6ParamsFactory] A factory function that returns the default K6 parameters.
   */
  constructor(rootUrl, defaultK6ParamsFactory) {
    this.rootUrl = rootUrl;
    this._defaultK6ParamsFactory = defaultK6ParamsFactory;
  }

  /**
   * @param {ListTicketsParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<ListTicketsApiResponse>}
   */
  async listTickets(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, LIST_TICKETS_PATH, 'get');
    rb.query('statuses', params.statuses, {});
    rb.query('priorities', params.priorities, {});
    rb.query('priority', params.priority, {});
    rb.query('ids', params.ids, {});
    rb.header('X-Statuses', params.xStatuses, {});

    return /** @type {ListTicketsApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {CreateTicketParams} [params]
   * @param {Params} [k6Params]
   * @returns {Promise<CreateTicketApiResponse>}
   */
  async createTicket(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, CREATE_TICKET_PATH, 'post');
    if (params) {
      rb.body(params.body, 'application/json');
    }

    return /** @type {CreateTicketApiResponse} */ (
      await rb.buildAsync({
        accept: 'application/json',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @param {UpdateTicketParams} params
   * @param {Params} [k6Params]
   * @returns {Promise<UpdateTicketApiResponse>}
   */
  async updateTicket(params, k6Params) {
    const rb = new RequestBuilder(this.rootUrl, UPDATE_TICKET_PATH, 'put');
    rb.path('id', params.id, {});
    rb.body(params.body, 'application/json');

    return /** @type {UpdateTicketApiResponse} */ (
      await rb.buildAsync({
        accept: '*/*',
        params: this.getK6Params(k6Params),
      })
    );
  }

  /**
   * @private
   * @param {Params} [k6Params]
   */
  getK6Params(k6Params) {
    return Object.assign({}, this._defaultK6ParamsFactory ? this._defaultK6ParamsFactory() : {}, k6Params);
  }
}
