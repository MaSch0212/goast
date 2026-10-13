import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { DeprecatedHeaderApiResponse, HeadersAndBodyApiResponse, HeadersOnNoContentApiResponse, MultipleHeadersApiResponse, RefHeaderApiResponse, RequiredHeaderApiResponse, SingleHeaderApiResponse } from '../models/responses/headers-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

@Injectable()
export class HeadersService extends ApiBaseService {
  private static readonly SINGLE_HEADER_PATH = '/one';
  private static readonly MULTIPLE_HEADERS_PATH = '/many';
  private static readonly REQUIRED_HEADER_PATH = '/required';
  private static readonly DEPRECATED_HEADER_PATH = '/deprecated';
  private static readonly REF_HEADER_PATH = '/ref';
  private static readonly HEADERS_ON_NO_CONTENT_PATH = '/no-content-headers';
  private static readonly HEADERS_AND_BODY_PATH = '/both';

  public singleHeader(context?: HttpContext): AbortablePromise<SingleHeaderApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, HeadersService.SINGLE_HEADER_PATH, 'get');

    return waitForResponse<SingleHeaderApiResponse>(
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

  public multipleHeaders(context?: HttpContext): AbortablePromise<MultipleHeadersApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, HeadersService.MULTIPLE_HEADERS_PATH, 'get');

    return waitForResponse<MultipleHeadersApiResponse>(
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

  public requiredHeader(context?: HttpContext): AbortablePromise<RequiredHeaderApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, HeadersService.REQUIRED_HEADER_PATH, 'get');

    return waitForResponse<RequiredHeaderApiResponse>(
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

  public deprecatedHeader(context?: HttpContext): AbortablePromise<DeprecatedHeaderApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, HeadersService.DEPRECATED_HEADER_PATH, 'get');

    return waitForResponse<DeprecatedHeaderApiResponse>(
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

  public refHeader(context?: HttpContext): AbortablePromise<RefHeaderApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, HeadersService.REF_HEADER_PATH, 'get');

    return waitForResponse<RefHeaderApiResponse>(
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

  public headersOnNoContent(context?: HttpContext): AbortablePromise<HeadersOnNoContentApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, HeadersService.HEADERS_ON_NO_CONTENT_PATH, 'get');

    return waitForResponse<HeadersOnNoContentApiResponse>(
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

  public headersAndBody(context?: HttpContext): AbortablePromise<HeadersAndBodyApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, HeadersService.HEADERS_AND_BODY_PATH, 'get');

    return waitForResponse<HeadersAndBodyApiResponse>(
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
