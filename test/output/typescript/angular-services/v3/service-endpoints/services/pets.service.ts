import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { Pet } from '../models/pet';
import type { CreatePetApiResponse, DeletePetApiResponse, GetPetApiResponse, ListPetsApiResponse, SearchPetsApiResponse } from '../models/responses/pets-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation createPet
 */
type CreatePetParams = {
    body: Pet;
  };

/**
 * Parameters for operation getPet
 */
type GetPetParams = {
    id: string;
  };

/**
 * Parameters for operation deletePet
 */
type DeletePetParams = {
    id: string;
  };

@Injectable()
export class PetsService extends ApiBaseService {
  private static readonly LIST_PETS_PATH = '/pets';
  private static readonly CREATE_PET_PATH = '/pets';
  private static readonly GET_PET_PATH = '/pets/{id}';
  private static readonly DELETE_PET_PATH = '/pets/{id}';
  private static readonly SEARCH_PETS_PATH = '/pets/search';

  public listPets(context?: HttpContext): AbortablePromise<ListPetsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PetsService.LIST_PETS_PATH, 'get');

    return waitForResponse<ListPetsApiResponse>(
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

  public createPet(params: CreatePetParams, context?: HttpContext): AbortablePromise<CreatePetApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PetsService.CREATE_PET_PATH, 'post');
    rb.body(params.body, 'application/json');

    return waitForResponse<CreatePetApiResponse>(
      this.http.request(rb.build({
        responseType: 'json',
        accept: 'application/json',
        context,
      })),
      {
        errorResponseTypes: {
          400: 'text',
          401: 'text',
          403: 'text',
          500: 'text',
        }
      }
    )
  }

  public getPet(params: GetPetParams, context?: HttpContext): AbortablePromise<GetPetApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PetsService.GET_PET_PATH, 'get');
    rb.path('id', params.id, {});

    return waitForResponse<GetPetApiResponse>(
      this.http.request(rb.build({
        responseType: 'json',
        accept: 'application/json',
        context,
      })),
      {
        errorResponseTypes: {
          401: 'text',
          403: 'text',
          404: 'text',
          500: 'text',
        }
      }
    )
  }

  public deletePet(params: DeletePetParams, context?: HttpContext): AbortablePromise<DeletePetApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PetsService.DELETE_PET_PATH, 'delete');
    rb.path('id', params.id, {});

    return waitForResponse<DeletePetApiResponse>(
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

  public searchPets(context?: HttpContext): AbortablePromise<SearchPetsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PetsService.SEARCH_PETS_PATH, 'get');

    return waitForResponse<SearchPetsApiResponse>(
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
}
