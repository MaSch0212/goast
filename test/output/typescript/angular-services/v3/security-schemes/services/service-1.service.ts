import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { AndSecurityApiResponse, InheritsSecurityApiResponse, MultiSecurityApiResponse, NoSecurityApiResponse, OverridesSecurityApiResponse, ScopedSecurityApiResponse } from '../models/responses/service-1-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

@Injectable()
export class Service1Service extends ApiBaseService {
  private static readonly INHERITS_SECURITY_PATH = '/inherits-security';
  private static readonly OVERRIDES_SECURITY_PATH = '/overrides-security';
  private static readonly NO_SECURITY_PATH = '/no-security';
  private static readonly MULTI_SECURITY_PATH = '/multi-security';
  private static readonly AND_SECURITY_PATH = '/and-security';
  private static readonly SCOPED_SECURITY_PATH = '/scoped';

  public inheritsSecurity(context?: HttpContext): AbortablePromise<InheritsSecurityApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, Service1Service.INHERITS_SECURITY_PATH, 'get');

    return waitForResponse<InheritsSecurityApiResponse>(
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

  public overridesSecurity(context?: HttpContext): AbortablePromise<OverridesSecurityApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, Service1Service.OVERRIDES_SECURITY_PATH, 'get');

    return waitForResponse<OverridesSecurityApiResponse>(
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

  public noSecurity(context?: HttpContext): AbortablePromise<NoSecurityApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, Service1Service.NO_SECURITY_PATH, 'get');

    return waitForResponse<NoSecurityApiResponse>(
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

  public multiSecurity(context?: HttpContext): AbortablePromise<MultiSecurityApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, Service1Service.MULTI_SECURITY_PATH, 'get');

    return waitForResponse<MultiSecurityApiResponse>(
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

  public andSecurity(context?: HttpContext): AbortablePromise<AndSecurityApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, Service1Service.AND_SECURITY_PATH, 'get');

    return waitForResponse<AndSecurityApiResponse>(
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

  public scopedSecurity(context?: HttpContext): AbortablePromise<ScopedSecurityApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, Service1Service.SCOPED_SECURITY_PATH, 'get');

    return waitForResponse<ScopedSecurityApiResponse>(
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
