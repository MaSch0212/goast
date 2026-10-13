import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { OpServerApiResponse, PathServerApiResponse, UntaggedApiResponse } from '../models/responses/service-2-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

@Injectable()
export class Service2Service extends ApiBaseService {
  private static readonly UNTAGGED_PATH = '/untagged';
  private static readonly PATH_SERVER_PATH = '/path-server';
  private static readonly OP_SERVER_PATH = '/op-server';

  public untagged(context?: HttpContext): AbortablePromise<UntaggedApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, Service2Service.UNTAGGED_PATH, 'get');

    return waitForResponse<UntaggedApiResponse>(
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

  public pathServer(context?: HttpContext): AbortablePromise<PathServerApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, Service2Service.PATH_SERVER_PATH, 'get');

    return waitForResponse<PathServerApiResponse>(
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

  public opServer(context?: HttpContext): AbortablePromise<OpServerApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, Service2Service.OP_SERVER_PATH, 'get');

    return waitForResponse<OpServerApiResponse>(
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
