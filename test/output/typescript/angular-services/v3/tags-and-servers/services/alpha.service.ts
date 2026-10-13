import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { OneTagApiResponse, SharedTagApiResponse, TwoTagsApiResponse } from '../models/responses/alpha-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * The Alpha tag.
 */
@Injectable()
export class AlphaService extends ApiBaseService {
  private static readonly ONE_TAG_PATH = '/one-tag';
  private static readonly TWO_TAGS_PATH = '/two-tags';
  private static readonly SHARED_TAG_PATH = '/shared-tag';

  public oneTag(context?: HttpContext): AbortablePromise<OneTagApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, AlphaService.ONE_TAG_PATH, 'get');

    return waitForResponse<OneTagApiResponse>(
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

  public twoTags(context?: HttpContext): AbortablePromise<TwoTagsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, AlphaService.TWO_TAGS_PATH, 'get');

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

  public sharedTag(context?: HttpContext): AbortablePromise<SharedTagApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, AlphaService.SHARED_TAG_PATH, 'get');

    return waitForResponse<SharedTagApiResponse>(
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
