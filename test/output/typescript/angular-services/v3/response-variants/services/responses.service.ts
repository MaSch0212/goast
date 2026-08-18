import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { ArrayResponseApiResponse, EmptyBody200ApiResponse, ErrorCodesApiResponse, MixedExactAndRangeApiResponse, MultiContentResponseApiResponse, NoContentApiResponse, OnlyDefaultApiResponse, PrimitiveResponseApiResponse, RangeCodesApiResponse, RefResponseApiResponse, SuccessAndDefaultApiResponse, TwoSuccessCodesApiResponse } from '../models/responses/responses-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

@Injectable()
export class ResponsesService extends ApiBaseService {
  private static readonly TWO_SUCCESS_CODES_PATH = '/two-success';
  private static readonly SUCCESS_AND_DEFAULT_PATH = '/default';
  private static readonly ONLY_DEFAULT_PATH = '/only-default';
  private static readonly NO_CONTENT_PATH = '/no-content';
  private static readonly EMPTY_BODY_200_PATH = '/empty-200';
  private static readonly RANGE_CODES_PATH = '/ranges';
  private static readonly MIXED_EXACT_AND_RANGE_PATH = '/mixed-codes';
  private static readonly ERROR_CODES_PATH = '/errors';
  private static readonly MULTI_CONTENT_RESPONSE_PATH = '/multi-content';
  private static readonly PRIMITIVE_RESPONSE_PATH = '/primitive';
  private static readonly ARRAY_RESPONSE_PATH = '/array';
  private static readonly REF_RESPONSE_PATH = '/ref-response';

  public twoSuccessCodes(context?: HttpContext): AbortablePromise<TwoSuccessCodesApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ResponsesService.TWO_SUCCESS_CODES_PATH, 'get');

    return waitForResponse<TwoSuccessCodesApiResponse>(
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

  public successAndDefault(context?: HttpContext): AbortablePromise<SuccessAndDefaultApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ResponsesService.SUCCESS_AND_DEFAULT_PATH, 'get');

    return waitForResponse<SuccessAndDefaultApiResponse>(
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

  public onlyDefault(context?: HttpContext): AbortablePromise<OnlyDefaultApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ResponsesService.ONLY_DEFAULT_PATH, 'get');

    return waitForResponse<OnlyDefaultApiResponse>(
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

  public noContent(context?: HttpContext): AbortablePromise<NoContentApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ResponsesService.NO_CONTENT_PATH, 'get');

    return waitForResponse<NoContentApiResponse>(
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

  public emptyBody200(context?: HttpContext): AbortablePromise<EmptyBody200ApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ResponsesService.EMPTY_BODY_200_PATH, 'get');

    return waitForResponse<EmptyBody200ApiResponse>(
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

  public rangeCodes(context?: HttpContext): AbortablePromise<RangeCodesApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ResponsesService.RANGE_CODES_PATH, 'get');

    return waitForResponse<RangeCodesApiResponse>(
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

  public mixedExactAndRange(context?: HttpContext): AbortablePromise<MixedExactAndRangeApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ResponsesService.MIXED_EXACT_AND_RANGE_PATH, 'get');

    return waitForResponse<MixedExactAndRangeApiResponse>(
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

  public errorCodes(context?: HttpContext): AbortablePromise<ErrorCodesApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ResponsesService.ERROR_CODES_PATH, 'get');

    return waitForResponse<ErrorCodesApiResponse>(
      this.http.request(rb.build({
        responseType: 'json',
        accept: 'application/json',
        context,
      })),
      {
        errorResponseTypes: {
          400: 'json',
          401: 'json',
          403: 'text',
          404: 'json',
          500: 'json',
        }
      }
    )
  }

  public multiContentResponse(context?: HttpContext): AbortablePromise<MultiContentResponseApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ResponsesService.MULTI_CONTENT_RESPONSE_PATH, 'get');

    return waitForResponse<MultiContentResponseApiResponse>(
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

  public primitiveResponse(context?: HttpContext): AbortablePromise<PrimitiveResponseApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ResponsesService.PRIMITIVE_RESPONSE_PATH, 'get');

    return waitForResponse<PrimitiveResponseApiResponse>(
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

  public arrayResponse(context?: HttpContext): AbortablePromise<ArrayResponseApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ResponsesService.ARRAY_RESPONSE_PATH, 'get');

    return waitForResponse<ArrayResponseApiResponse>(
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

  public refResponse(context?: HttpContext): AbortablePromise<RefResponseApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ResponsesService.REF_RESPONSE_PATH, 'get');

    return waitForResponse<RefResponseApiResponse>(
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
