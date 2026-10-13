import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { ParamSchema } from '../models/param-schema';
import type { AllowEmptyValueParamApiResponse, CookieParamsApiResponse, DescribedParamsApiResponse, HeaderParamsApiResponse, MixedParamsApiResponse, QueryParamsApiResponse, ReservedCharParamApiResponse, TwoPathParamsApiResponse } from '../models/responses/parameters-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation twoPathParams
 */
type TwoPathParamsParams = {
    id: string;
    sub: number;
  };

/**
 * Parameters for operation queryParams
 */
type QueryParamsParams = {
    requiredString: string;
    optionalString?: string;
    intWithDefault?: number;
    flag?: boolean;
  };

/**
 * Parameters for operation headerParams
 */
type HeaderParamsParams = {
    xRequestId: string;
    xOptionalHeader?: string;
  };

/**
 * Parameters for operation cookieParams
 */
type CookieParamsParams = {
    session?: string;
  };

/**
 * Parameters for operation mixedParams
 */
type MixedParamsParams = {
    id: string;
    filter?: string;
    xTraceId?: string;
    session?: string;
  };

/**
 * Parameters for operation describedParams
 */
type DescribedParamsParams = {
    /**
     * A parameter with a description.
     */
    withDescription?: string;

    withoutDescription?: string;
    withExample?: string;
    withRefSchema?: ParamSchema;
  };

/**
 * Parameters for operation allowEmptyValueParam
 */
type AllowEmptyValueParamParams = {
    search?: string;
  };

/**
 * Parameters for operation reservedCharParam
 */
type ReservedCharParamParams = {
    filter?: string;
  };

@Injectable()
export class ParametersService extends ApiBaseService {
  private static readonly TWO_PATH_PARAMS_PATH = '/path/{id}/{sub}';
  private static readonly QUERY_PARAMS_PATH = '/query';
  private static readonly HEADER_PARAMS_PATH = '/header';
  private static readonly COOKIE_PARAMS_PATH = '/cookie';
  private static readonly MIXED_PARAMS_PATH = '/mixed/{id}';
  private static readonly DESCRIBED_PARAMS_PATH = '/described';
  private static readonly ALLOW_EMPTY_VALUE_PARAM_PATH = '/empty-value';
  private static readonly RESERVED_CHAR_PARAM_PATH = '/reserved';

  public twoPathParams(params: TwoPathParamsParams, context?: HttpContext): AbortablePromise<TwoPathParamsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ParametersService.TWO_PATH_PARAMS_PATH, 'get');
    rb.path('id', params.id, {});
    rb.path('sub', params.sub, {});

    return waitForResponse<TwoPathParamsApiResponse>(
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

  public queryParams(params: QueryParamsParams, context?: HttpContext): AbortablePromise<QueryParamsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ParametersService.QUERY_PARAMS_PATH, 'get');
    rb.query('requiredString', params.requiredString, {});
    rb.query('optionalString', params.optionalString, {});
    rb.query('intWithDefault', params.intWithDefault, {});
    rb.query('flag', params.flag, {});

    return waitForResponse<QueryParamsApiResponse>(
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

  public headerParams(params: HeaderParamsParams, context?: HttpContext): AbortablePromise<HeaderParamsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ParametersService.HEADER_PARAMS_PATH, 'get');
    rb.header('X-Request-Id', params.xRequestId, {});
    rb.header('X-Optional-Header', params.xOptionalHeader, {});

    return waitForResponse<HeaderParamsApiResponse>(
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

  public cookieParams(params?: CookieParamsParams, context?: HttpContext): AbortablePromise<CookieParamsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ParametersService.COOKIE_PARAMS_PATH, 'get');
    if (params) {
    }

    return waitForResponse<CookieParamsApiResponse>(
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

  public mixedParams(params: MixedParamsParams, context?: HttpContext): AbortablePromise<MixedParamsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ParametersService.MIXED_PARAMS_PATH, 'get');
    rb.path('id', params.id, {});
    rb.query('filter', params.filter, {});
    rb.header('X-Trace-Id', params.xTraceId, {});

    return waitForResponse<MixedParamsApiResponse>(
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

  public describedParams(params?: DescribedParamsParams, context?: HttpContext): AbortablePromise<DescribedParamsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ParametersService.DESCRIBED_PARAMS_PATH, 'get');
    if (params) {
      rb.query('withDescription', params.withDescription, {});
      rb.query('withoutDescription', params.withoutDescription, {});
      rb.query('withExample', params.withExample, {});
      rb.query('withRefSchema', params.withRefSchema, {});
    }

    return waitForResponse<DescribedParamsApiResponse>(
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

  public allowEmptyValueParam(params?: AllowEmptyValueParamParams, context?: HttpContext): AbortablePromise<AllowEmptyValueParamApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ParametersService.ALLOW_EMPTY_VALUE_PARAM_PATH, 'get');
    if (params) {
      rb.query('search', params.search, {});
    }

    return waitForResponse<AllowEmptyValueParamApiResponse>(
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

  public reservedCharParam(params?: ReservedCharParamParams, context?: HttpContext): AbortablePromise<ReservedCharParamApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ParametersService.RESERVED_CHAR_PARAM_PATH, 'get');
    if (params) {
      rb.query('filter', params.filter, {});
    }

    return waitForResponse<ReservedCharParamApiResponse>(
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
