import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { DeepObjectApiResponse, FormArrayApiResponse, FormArrayNoExplodeApiResponse, FormObjectApiResponse, LabelPathApiResponse, MatrixPathApiResponse, PipeDelimitedApiResponse, SimpleHeaderApiResponse, SimplePathApiResponse, SpaceDelimitedApiResponse } from '../models/responses/styles-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation formArray
 */
type FormArrayParams = {
    tags?: (string)[];
  };

/**
 * Parameters for operation formArrayNoExplode
 */
type FormArrayNoExplodeParams = {
    tags?: (string)[];
  };

/**
 * Parameters for operation formObject
 */
type FormObjectParams = {
    coordinates?: {
      label?: string;
      count?: number;
    };
  };

/**
 * Parameters for operation spaceDelimited
 */
type SpaceDelimitedParams = {
    tags?: (string)[];
  };

/**
 * Parameters for operation pipeDelimited
 */
type PipeDelimitedParams = {
    tags?: (string)[];
  };

/**
 * Parameters for operation deepObject
 */
type DeepObjectParams = {
    filter?: {
      label?: string;
      count?: number;
    };
  };

/**
 * Parameters for operation simplePath
 */
type SimplePathParams = {
    values: (string)[];
  };

/**
 * Parameters for operation labelPath
 */
type LabelPathParams = {
    values: (string)[];
  };

/**
 * Parameters for operation matrixPath
 */
type MatrixPathParams = {
    values: (string)[];
  };

/**
 * Parameters for operation simpleHeader
 */
type SimpleHeaderParams = {
    xTags?: (string)[];
  };

@Injectable()
export class StylesService extends ApiBaseService {
  private static readonly FORM_ARRAY_PATH = '/query-form-array';
  private static readonly FORM_ARRAY_NO_EXPLODE_PATH = '/query-form-array-no-explode';
  private static readonly FORM_OBJECT_PATH = '/query-form-object';
  private static readonly SPACE_DELIMITED_PATH = '/query-space-delimited';
  private static readonly PIPE_DELIMITED_PATH = '/query-pipe-delimited';
  private static readonly DEEP_OBJECT_PATH = '/query-deep-object';
  private static readonly SIMPLE_PATH_PATH = '/simple-path/{values}';
  private static readonly LABEL_PATH_PATH = '/label-path/{values}';
  private static readonly MATRIX_PATH_PATH = '/matrix-path/{values}';
  private static readonly SIMPLE_HEADER_PATH = '/simple-header';

  public formArray(params?: FormArrayParams, context?: HttpContext): AbortablePromise<FormArrayApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, StylesService.FORM_ARRAY_PATH, 'get');
    if (params) {
      rb.query('tags', params.tags, {
        style: 'form',
        explode: true,
      });
    }

    return waitForResponse<FormArrayApiResponse>(
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

  public formArrayNoExplode(params?: FormArrayNoExplodeParams, context?: HttpContext): AbortablePromise<FormArrayNoExplodeApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, StylesService.FORM_ARRAY_NO_EXPLODE_PATH, 'get');
    if (params) {
      rb.query('tags', params.tags, {
        style: 'form',
        explode: false,
      });
    }

    return waitForResponse<FormArrayNoExplodeApiResponse>(
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

  public formObject(params?: FormObjectParams, context?: HttpContext): AbortablePromise<FormObjectApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, StylesService.FORM_OBJECT_PATH, 'get');
    if (params) {
      rb.query('coordinates', params.coordinates, {
        style: 'form',
        explode: true,
      });
    }

    return waitForResponse<FormObjectApiResponse>(
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

  public spaceDelimited(params?: SpaceDelimitedParams, context?: HttpContext): AbortablePromise<SpaceDelimitedApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, StylesService.SPACE_DELIMITED_PATH, 'get');
    if (params) {
      rb.query('tags', params.tags, {
        style: 'spaceDelimited',
        explode: false,
      });
    }

    return waitForResponse<SpaceDelimitedApiResponse>(
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

  public pipeDelimited(params?: PipeDelimitedParams, context?: HttpContext): AbortablePromise<PipeDelimitedApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, StylesService.PIPE_DELIMITED_PATH, 'get');
    if (params) {
      rb.query('tags', params.tags, {
        style: 'pipeDelimited',
        explode: false,
      });
    }

    return waitForResponse<PipeDelimitedApiResponse>(
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

  public deepObject(params?: DeepObjectParams, context?: HttpContext): AbortablePromise<DeepObjectApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, StylesService.DEEP_OBJECT_PATH, 'get');
    if (params) {
      rb.query('filter', params.filter, {
        style: 'deepObject',
        explode: true,
      });
    }

    return waitForResponse<DeepObjectApiResponse>(
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

  public simplePath(params: SimplePathParams, context?: HttpContext): AbortablePromise<SimplePathApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, StylesService.SIMPLE_PATH_PATH, 'get');
    rb.path('values', params.values, {
      style: 'simple',
      explode: false,
    });

    return waitForResponse<SimplePathApiResponse>(
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

  public labelPath(params: LabelPathParams, context?: HttpContext): AbortablePromise<LabelPathApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, StylesService.LABEL_PATH_PATH, 'get');
    rb.path('values', params.values, {
      style: 'label',
      explode: false,
    });

    return waitForResponse<LabelPathApiResponse>(
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

  public matrixPath(params: MatrixPathParams, context?: HttpContext): AbortablePromise<MatrixPathApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, StylesService.MATRIX_PATH_PATH, 'get');
    rb.path('values', params.values, {
      style: 'matrix',
      explode: false,
    });

    return waitForResponse<MatrixPathApiResponse>(
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

  public simpleHeader(params?: SimpleHeaderParams, context?: HttpContext): AbortablePromise<SimpleHeaderApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, StylesService.SIMPLE_HEADER_PATH, 'get');
    if (params) {
      rb.header('X-Tags', params.xTags, {
        style: 'simple',
        explode: false,
      });
    }

    return waitForResponse<SimpleHeaderApiResponse>(
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
