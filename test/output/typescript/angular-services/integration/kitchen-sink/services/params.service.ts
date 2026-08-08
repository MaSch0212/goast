import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { AllLocationsApiResponse, GetEncodedApiResponse, PathStyleSimpleApiResponse, StyleMatrixApiResponse } from '../models/responses/params-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation allLocations
 */
type AllLocationsParams = {
    pathParam: string;
    queryParam?: string;
    xHeaderParam?: string;
    session?: string;
  };

/**
 * Parameters for operation styleMatrix
 */
type StyleMatrixParams = {
    formExploded?: (string)[];
    formUnexploded?: (string)[];
    spaceDelimited?: (string)[];
  };

/**
 * Parameters for operation pathStyleSimple
 */
type PathStyleSimpleParams = {
    values: (string)[];
  };

/**
 * Parameters for operation getEncoded
 */
type GetEncodedParams = {
    value: string;
    raw?: string;
  };

@Injectable()
export class ParamsService extends ApiBaseService {
  private static readonly ALL_LOCATIONS_PATH = '/locations/{pathParam}';
  private static readonly STYLE_MATRIX_PATH = '/styles';
  private static readonly PATH_STYLE_SIMPLE_PATH = '/styles/{values}';
  private static readonly GET_ENCODED_PATH = '/encoded/{value}';

  public allLocations(params: AllLocationsParams, context?: HttpContext): AbortablePromise<AllLocationsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ParamsService.ALL_LOCATIONS_PATH, 'get');
    rb.path('pathParam', params.pathParam, {});
    rb.query('queryParam', params.queryParam, {});
    rb.header('X-Header-Param', params.xHeaderParam, {});

    return waitForResponse<AllLocationsApiResponse>(
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

  public styleMatrix(params?: StyleMatrixParams, context?: HttpContext): AbortablePromise<StyleMatrixApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ParamsService.STYLE_MATRIX_PATH, 'get');
    if (params) {
      rb.query('formExploded', params.formExploded, {
        style: 'form',
        explode: true,
      });
      rb.query('formUnexploded', params.formUnexploded, {
        style: 'form',
        explode: false,
      });
      rb.query('spaceDelimited', params.spaceDelimited, {
        style: 'spaceDelimited',
        explode: false,
      });
    }

    return waitForResponse<StyleMatrixApiResponse>(
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

  public pathStyleSimple(params: PathStyleSimpleParams, context?: HttpContext): AbortablePromise<PathStyleSimpleApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ParamsService.PATH_STYLE_SIMPLE_PATH, 'get');
    rb.path('values', params.values, {
      style: 'simple',
      explode: false,
    });

    return waitForResponse<PathStyleSimpleApiResponse>(
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

  public getEncoded(params: GetEncodedParams, context?: HttpContext): AbortablePromise<GetEncodedApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ParamsService.GET_ENCODED_PATH, 'get');
    rb.path('value', params.value, {});
    rb.query('raw', params.raw, {});

    return waitForResponse<GetEncodedApiResponse>(
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
