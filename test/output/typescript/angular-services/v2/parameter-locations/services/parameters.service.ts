import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { Payload } from '../models/payload';
import type { BodyParamApiResponse, FileUploadApiResponse, FormDataParamsApiResponse, QueryParamsApiResponse } from '../models/responses/parameters-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation bodyParam
 */
type BodyParamParams = {
    payload: Payload;
  };

/**
 * Parameters for operation formDataParams
 */
type FormDataParamsParams = {
    title?: unknown;
    count?: unknown;
    active?: unknown;
  };

/**
 * Parameters for operation fileUpload
 */
type FileUploadParams = {
    file?: unknown;
    description?: unknown;
  };

/**
 * Parameters for operation queryParams
 */
type QueryParamsParams = {
    tags?: unknown;
    ids?: unknown;
  };

@Injectable()
export class ParametersService extends ApiBaseService {
  private static readonly BODY_PARAM_PATH = '/body';
  private static readonly FORM_DATA_PARAMS_PATH = '/form';
  private static readonly FILE_UPLOAD_PATH = '/upload';
  private static readonly QUERY_PARAMS_PATH = '/query';

  public bodyParam(params: BodyParamParams, context?: HttpContext): AbortablePromise<BodyParamApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ParametersService.BODY_PARAM_PATH, 'post');


    return waitForResponse<BodyParamApiResponse>(
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

  public formDataParams(params?: FormDataParamsParams, context?: HttpContext): AbortablePromise<FormDataParamsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ParametersService.FORM_DATA_PARAMS_PATH, 'post');
    if (params) {
    }

    return waitForResponse<FormDataParamsApiResponse>(
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

  public fileUpload(params?: FileUploadParams, context?: HttpContext): AbortablePromise<FileUploadApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ParametersService.FILE_UPLOAD_PATH, 'post');
    if (params) {
    }

    return waitForResponse<FileUploadApiResponse>(
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

  public queryParams(params?: QueryParamsParams, context?: HttpContext): AbortablePromise<QueryParamsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, ParametersService.QUERY_PARAMS_PATH, 'get');
    if (params) {
      rb.query('tags', params.tags, {});
      rb.query('ids', params.ids, {});
    }

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
}
