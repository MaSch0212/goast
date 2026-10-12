import { UrlBuilder } from '../utils/fetch-client.utils';

import type { Priority } from '../models/priority';
import type { Status } from '../models/status';
import type { Ticket } from '../models/ticket';
import type { FetchClientOptions, TypedResponse } from '../utils/fetch-client.utils';

export const TICKETS_CLIENT_DEFAULT_OPTIONS: FetchClientOptions = {};

export class TicketsClient {
  /**
   * Options for the fetch client.
   */
  public options: FetchClientOptions;

  constructor(options?: Partial<FetchClientOptions>) {
    this.options = { ...TICKETS_CLIENT_DEFAULT_OPTIONS, ...options };
  }

  /**
   * @param params Parameters for the endpoint.
   */
  public listTickets(params: {
      statuses: (Status)[];
      priorities?: (Priority)[];
      priority?: Priority;
      ids?: (string)[];
      xStatuses?: (Status)[];
    }): Promise<TypedResponse<(Ticket)[]>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/tickets')
      .withQueryParam('statuses', params.statuses)
      .withQueryParam('priorities', params.priorities)
      .withQueryParam('priority', params.priority)
      .withQueryParam('ids', params.ids)
      .build();
    const headers = { ...this.options.headers };
    if (params && params.xStatuses !== undefined) {
      headers['X-Statuses'] = String(params.xStatuses);
    }
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<(Ticket)[]>>;
  }

  /**
   * @param body Body for the endpoint.
   */
  public createTicket(body: Ticket): Promise<TypedResponse<Ticket>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/tickets')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<Ticket>>;
  }

  /**
   * @param params Parameters for the endpoint.
   * @param body Body for the endpoint.
   */
  public updateTicket(params: {
      id: string;
    }, body: Ticket): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/tickets/{id}')
      .withPathParam('id', params.id)
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(body),
    });
    Object.defineProperty(response, 'isVoidResponse', { value: true });
    return response as unknown as Promise<TypedResponse<void>>;
  }
}
