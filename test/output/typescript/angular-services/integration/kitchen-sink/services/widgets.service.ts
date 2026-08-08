import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { GetWidgetApiResponse } from '../models/responses/widgets-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation getWidget
 */
type GetWidgetParams = {
    id: string;
  };

@Injectable()
export class WidgetsService extends ApiBaseService {
  private static readonly GET_WIDGET_PATH = '/widgets/{id}';

  public getWidget(params: GetWidgetParams, context?: HttpContext): AbortablePromise<GetWidgetApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, WidgetsService.GET_WIDGET_PATH, 'get');
    rb.path('id', params.id, {});

    return waitForResponse<GetWidgetApiResponse>(
      this.http.request(rb.build({
        responseType: 'json',
        accept: 'application/json',
        context,
      })),
      {
        errorResponseTypes: {
          400: 'json',
          401: 'text',
          403: 'text',
          404: 'json',
          500: 'json',
        }
      }
    )
  }
}
