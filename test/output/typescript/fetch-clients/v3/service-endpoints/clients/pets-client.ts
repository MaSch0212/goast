import { UrlBuilder } from '../utils/fetch-client.utils';

import type { Pet } from '../models/pet';
import type { FetchClientOptions, TypedResponse } from '../utils/fetch-client.utils';

export const PETS_CLIENT_DEFAULT_OPTIONS: FetchClientOptions = {};

export class PetsClient {
  /**
   * Options for the fetch client.
   */
  public options: FetchClientOptions;

  constructor(options?: Partial<FetchClientOptions>) {
    this.options = { ...PETS_CLIENT_DEFAULT_OPTIONS, ...options };
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

  /**
   * @param params Parameters for the endpoint.
   */
  public getPet(params: {
      id: string;
    }): Promise<TypedResponse<Pet>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/pets/{id}')
      .withPathParam('id', params.id)
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<Pet>>;
  }

  /**
   * @param params Parameters for the endpoint.
   */
  public deletePet(params: {
      id: string;
    }): Promise<TypedResponse<void>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/pets/{id}')
      .withPathParam('id', params.id)
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'DELETE',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: true });
    return response as unknown as Promise<TypedResponse<void>>;
  }

  public searchPets(): Promise<TypedResponse<Pet>> {
    const url = new UrlBuilder(this.options.baseUrl)
      .withPath('/pets/search')
      .build();
    const headers = { ...this.options.headers };
    const response = (this.options.fetch ?? fetch)(url, {
      method: 'GET',
      headers: headers,
    });
    Object.defineProperty(response, 'isVoidResponse', { value: false });
    return response as unknown as Promise<TypedResponse<Pet>>;
  }
}
