import { UrlBuilder } from '../utils/fetch-client.utils';

import type { Owner } from '../models/owner';
import type { Pet } from '../models/pet';
import type { FetchClientOptions, TypedResponse } from '../utils/fetch-client.utils';

export const SERVICE_1_CLIENT_DEFAULT_OPTIONS: FetchClientOptions = {};

export class Service1Client {
  /**
   * Options for the fetch client.
   */
  public options: FetchClientOptions;

  constructor(options?: Partial<FetchClientOptions>) {
    this.options = { ...SERVICE_1_CLIENT_DEFAULT_OPTIONS, ...options };
  }

  /**
   * @param params Parameters for the endpoint.
   */
  public getOwner(params: {
      id: string;
    }): Promise<TypedResponse<Owner>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/owners/{id}')
      .withPathParam('id', params.id)
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<Owner>>;
  }

  public listPets(): Promise<TypedResponse<(Pet)[]>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/pets')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<(Pet)[]>>;
  }

  /**
   * @param body Body for the endpoint.
   */
  public createPet(body: Pet): Promise<TypedResponse<Pet>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/pets')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<Pet>>;
  }
}
