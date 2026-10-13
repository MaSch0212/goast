import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { CaseVarietyApiResponse, OverlapLiteralApiResponse, OverlapTemplatedApiResponse, ParamOnlyPathApiResponse, ThreeParamsApiResponse, TrailingSlashApiResponse, VeryDeepPathApiResponse, WithAtApiResponse, WithColonApiResponse, WithDashApiResponse, WithDotApiResponse, WithTildeApiResponse, WithUnderscoreApiResponse } from '../models/responses/paths-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation overlapTemplated
 */
type OverlapTemplatedParams = {
    id: string;
  };

/**
 * Parameters for operation paramOnlyPath
 */
type ParamOnlyPathParams = {
    id: string;
  };

/**
 * Parameters for operation threeParams
 */
type ThreeParamsParams = {
    p1: string;
    p2: string;
    p3: string;
  };

@Injectable()
export class PathsService extends ApiBaseService {
  private static readonly OVERLAP_TEMPLATED_PATH = '/overlap/{id}';
  private static readonly OVERLAP_LITERAL_PATH = '/overlap/fixed';
  private static readonly WITH_DOT_PATH = '/with.dot';
  private static readonly WITH_DASH_PATH = '/with-dash';
  private static readonly WITH_UNDERSCORE_PATH = '/with_underscore';
  private static readonly WITH_TILDE_PATH = '/with~tilde';
  private static readonly WITH_COLON_PATH = '/with:colon';
  private static readonly WITH_AT_PATH = '/with@at';
  private static readonly TRAILING_SLASH_PATH = '/trailing/';
  private static readonly PARAM_ONLY_PATH_PATH = '/{id}';
  private static readonly THREE_PARAMS_PATH = '/a/{p1}/b/{p2}/c/{p3}';
  private static readonly CASE_VARIETY_PATH = '/UPPER/Mixed/lower';
  private static readonly VERY_DEEP_PATH_PATH = '/very/deep/nested/path/with/many/segments/here';

  public overlapTemplated(params: OverlapTemplatedParams, context?: HttpContext): AbortablePromise<OverlapTemplatedApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PathsService.OVERLAP_TEMPLATED_PATH, 'get');
    rb.path('id', params.id, {});

    return waitForResponse<OverlapTemplatedApiResponse>(
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

  public overlapLiteral(context?: HttpContext): AbortablePromise<OverlapLiteralApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PathsService.OVERLAP_LITERAL_PATH, 'get');

    return waitForResponse<OverlapLiteralApiResponse>(
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

  public withDot(context?: HttpContext): AbortablePromise<WithDotApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PathsService.WITH_DOT_PATH, 'get');

    return waitForResponse<WithDotApiResponse>(
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

  public withDash(context?: HttpContext): AbortablePromise<WithDashApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PathsService.WITH_DASH_PATH, 'get');

    return waitForResponse<WithDashApiResponse>(
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

  public withUnderscore(context?: HttpContext): AbortablePromise<WithUnderscoreApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PathsService.WITH_UNDERSCORE_PATH, 'get');

    return waitForResponse<WithUnderscoreApiResponse>(
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

  public withTilde(context?: HttpContext): AbortablePromise<WithTildeApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PathsService.WITH_TILDE_PATH, 'get');

    return waitForResponse<WithTildeApiResponse>(
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

  public withColon(context?: HttpContext): AbortablePromise<WithColonApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PathsService.WITH_COLON_PATH, 'get');

    return waitForResponse<WithColonApiResponse>(
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

  public withAt(context?: HttpContext): AbortablePromise<WithAtApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PathsService.WITH_AT_PATH, 'get');

    return waitForResponse<WithAtApiResponse>(
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

  public trailingSlash(context?: HttpContext): AbortablePromise<TrailingSlashApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PathsService.TRAILING_SLASH_PATH, 'get');

    return waitForResponse<TrailingSlashApiResponse>(
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

  public paramOnlyPath(params: ParamOnlyPathParams, context?: HttpContext): AbortablePromise<ParamOnlyPathApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PathsService.PARAM_ONLY_PATH_PATH, 'get');
    rb.path('id', params.id, {});

    return waitForResponse<ParamOnlyPathApiResponse>(
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

  public threeParams(params: ThreeParamsParams, context?: HttpContext): AbortablePromise<ThreeParamsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PathsService.THREE_PARAMS_PATH, 'get');
    rb.path('p1', params.p1, {});
    rb.path('p2', params.p2, {});
    rb.path('p3', params.p3, {});

    return waitForResponse<ThreeParamsApiResponse>(
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

  public caseVariety(context?: HttpContext): AbortablePromise<CaseVarietyApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PathsService.CASE_VARIETY_PATH, 'get');

    return waitForResponse<CaseVarietyApiResponse>(
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

  public veryDeepPath(context?: HttpContext): AbortablePromise<VeryDeepPathApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PathsService.VERY_DEEP_PATH_PATH, 'get');

    return waitForResponse<VeryDeepPathApiResponse>(
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
