import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { TagWithSpaceApiResponse } from '../models/responses/tag-with-space-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

@Injectable()
export class TagWithSpaceService extends ApiBaseService {
  private static readonly TAG_WITH_SPACE_PATH = '/tag-with-space';

  public tagWithSpace(context?: HttpContext): AbortablePromise<TagWithSpaceApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, TagWithSpaceService.TAG_WITH_SPACE_PATH, 'get');

    return waitForResponse<TagWithSpaceApiResponse>(
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
