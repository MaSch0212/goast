import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { InheritsAndAddsApiResponse, InheritsParamsApiResponse, OverridesParamApiResponse, RefParamApiResponse } from '../models/responses/inheritance-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation inheritsParams
 */
type InheritsParamsParams = {
    id: string;
    common?: string;
  };

/**
 * Parameters for operation inheritsAndAdds
 */
type InheritsAndAddsParams = {
    id: string;
    common?: string;
    extra?: string;
  };

/**
 * Parameters for operation overridesParam
 */
type OverridesParamParams = {
    id: string;

    /**
     * Overrides the inherited parameter with a different type.
     */
    common?: number;
  };

/**
 * Parameters for operation refParam
 */
type RefParamParams = {
    id: string;
    page?: number;
  };

@Injectable()
export class InheritanceService extends ApiBaseService {
  private static readonly INHERITS_PARAMS_PATH = '/inherited/{id}';
  private static readonly INHERITS_AND_ADDS_PATH = '/inherited/{id}';
  private static readonly OVERRIDES_PARAM_PATH = '/overridden/{id}';
  private static readonly REF_PARAM_PATH = '/ref-param/{id}';

  public inheritsParams(params: InheritsParamsParams, context?: HttpContext): AbortablePromise<InheritsParamsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, InheritanceService.INHERITS_PARAMS_PATH, 'get');
    rb.path('id', params.id, {});
    rb.query('common', params.common, {});

    return waitForResponse<InheritsParamsApiResponse>(
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

  public inheritsAndAdds(params: InheritsAndAddsParams, context?: HttpContext): AbortablePromise<InheritsAndAddsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, InheritanceService.INHERITS_AND_ADDS_PATH, 'post');
    rb.path('id', params.id, {});
    rb.query('common', params.common, {});
    rb.query('extra', params.extra, {});

    return waitForResponse<InheritsAndAddsApiResponse>(
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

  public overridesParam(params: OverridesParamParams, context?: HttpContext): AbortablePromise<OverridesParamApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, InheritanceService.OVERRIDES_PARAM_PATH, 'get');
    rb.path('id', params.id, {});
    rb.query('common', params.common, {});

    return waitForResponse<OverridesParamApiResponse>(
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

  public refParam(params: RefParamParams, context?: HttpContext): AbortablePromise<RefParamApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, InheritanceService.REF_PARAM_PATH, 'get');
    rb.path('id', params.id, {});
    rb.query('page', params.page, {});

    return waitForResponse<RefParamApiResponse>(
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
