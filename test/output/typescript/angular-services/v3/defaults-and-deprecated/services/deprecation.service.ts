import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { DeprecatedOpApiResponse, DeprecatedOpNoDescApiResponse, DeprecatedParamsApiResponse } from '../models/responses/deprecation-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation deprecatedParams
 */
type DeprecatedParamsParams = {
    /**
     * This parameter is deprecated.
     *
     * @deprecated
     */
    withDesc?: string;

    /**
     * @deprecated
     */
    noDesc?: string;

    plain?: string;
  };

@Injectable()
export class DeprecationService extends ApiBaseService {
  private static readonly DEPRECATED_OP_PATH = '/deprecated-op';
  private static readonly DEPRECATED_OP_NO_DESC_PATH = '/deprecated-op-no-desc';
  private static readonly DEPRECATED_PARAMS_PATH = '/deprecated-params';

  /**
   * This operation is deprecated.
   *
   * @deprecated
   */
  public deprecatedOp(context?: HttpContext): AbortablePromise<DeprecatedOpApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, DeprecationService.DEPRECATED_OP_PATH, 'get');

    return waitForResponse<DeprecatedOpApiResponse>(
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

  /**
   * @deprecated
   */
  public deprecatedOpNoDesc(context?: HttpContext): AbortablePromise<DeprecatedOpNoDescApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, DeprecationService.DEPRECATED_OP_NO_DESC_PATH, 'get');

    return waitForResponse<DeprecatedOpNoDescApiResponse>(
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

  public deprecatedParams(params?: DeprecatedParamsParams, context?: HttpContext): AbortablePromise<DeprecatedParamsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, DeprecationService.DEPRECATED_PARAMS_PATH, 'get');
    if (params) {
      rb.query('withDesc', params.withDesc, {});
      rb.query('noDesc', params.noDesc, {});
      rb.query('plain', params.plain, {});
    }

    return waitForResponse<DeprecatedParamsApiResponse>(
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
