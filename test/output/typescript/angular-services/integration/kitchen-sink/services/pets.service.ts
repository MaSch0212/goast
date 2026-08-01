import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { GetPetApiResponse } from '../models/responses/pets-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation getPet
 */
type GetPetParams = {
    id: string;
  };

@Injectable()
export class PetsService extends ApiBaseService {
  private static readonly GET_PET_PATH = '/pets/{id}';

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
          500: 'text',
        }
      }
    )
  }
}
