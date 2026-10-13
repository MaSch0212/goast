import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { Pet } from '../models/pet';
import type { CreatePetApiResponse, GetOwnerApiResponse, ListPetsApiResponse } from '../models/responses/service-1-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation getOwner
 */
type GetOwnerParams = {
    id: string;
  };

/**
 * Parameters for operation createPet
 */
type CreatePetParams = {
    body: Pet;
  };

@Injectable()
export class Service1Service extends ApiBaseService {
  private static readonly GET_OWNER_PATH = '/owners/{id}';
  private static readonly LIST_PETS_PATH = '/pets';
  private static readonly CREATE_PET_PATH = '/pets';

  public getOwner(params: GetOwnerParams, context?: HttpContext): AbortablePromise<GetOwnerApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, Service1Service.GET_OWNER_PATH, 'get');
    rb.path('id', params.id, {});

    return waitForResponse<GetOwnerApiResponse>(
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

  public listPets(context?: HttpContext): AbortablePromise<ListPetsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, Service1Service.LIST_PETS_PATH, 'get');

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
    const rb = new RequestBuilder(this.rootUrl, Service1Service.CREATE_PET_PATH, 'post');
    rb.body(params.body, 'application/json');

    return waitForResponse<CreatePetApiResponse>(
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
