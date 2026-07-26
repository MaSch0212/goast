import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { ListThingsApiResponse } from '../models/responses/service-1-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

@Injectable()
export class Service1Service extends ApiBaseService {
  private static readonly LIST_THINGS_PATH = '/things';

  public listThings(context?: HttpContext): AbortablePromise<ListThingsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, Service1Service.LIST_THINGS_PATH, 'get');

    return waitForResponse<ListThingsApiResponse>(
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
