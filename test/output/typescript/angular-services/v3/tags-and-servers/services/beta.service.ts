import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { TwoTagsApiResponse } from '../models/responses/beta-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

@Injectable()
export class BetaService extends ApiBaseService {
  private static readonly TWO_TAGS_PATH = '/two-tags';

  public twoTags(context?: HttpContext): AbortablePromise<TwoTagsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, BetaService.TWO_TAGS_PATH, 'get');

    return waitForResponse<TwoTagsApiResponse>(
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
}
