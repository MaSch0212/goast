import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { Payload } from '../models/payload';
import type { AnyBodyApiResponse, ArrayJsonBodyApiResponse, BinaryBodyApiResponse, DescribedBodyApiResponse, FormBodyApiResponse, InlineJsonBodyApiResponse, JsonBodyApiResponse, MultiContentBodyApiResponse, OptionalJsonBodyApiResponse, PrimitiveJsonBodyApiResponse, RefBodyApiResponse, TextBodyApiResponse } from '../models/responses/bodies-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation jsonBody
 */
type JsonBodyParams = {
    body: Payload;
  };

/**
 * Parameters for operation optionalJsonBody
 */
type OptionalJsonBodyParams = {
    body?: Payload;
  };

/**
 * Parameters for operation inlineJsonBody
 */
type InlineJsonBodyParams = {
    body: {
      name: string;
      count?: number;
    };
  };

/**
 * Parameters for operation arrayJsonBody
 */
type ArrayJsonBodyParams = {
    body: (Payload)[];
  };

/**
 * Parameters for operation primitiveJsonBody
 */
type PrimitiveJsonBodyParams = {
    body: string;
  };

/**
 * Parameters for operation textBody
 */
type TextBodyParams = {
    body: string;
  };

/**
 * Parameters for operation binaryBody
 */
type BinaryBodyParams = {
    body: Blob;
  };

/**
 * Parameters for operation anyBody
 */
type AnyBodyParams = {
    body: unknown;
  };

/**
 * Parameters for operation multiContentBody
 */
type MultiContentBodyParams = {
    body: Payload;
  };

/**
 * Parameters for operation formBody
 */
type FormBodyParams = {
    body: {
      username?: string;
      age?: number;
      subscribed?: boolean;
    };
  };

/**
 * Parameters for operation describedBody
 */
type DescribedBodyParams = {
    /**
     * A body with an explanation of its purpose.
     */
    body: Payload;
  };

/**
 * Parameters for operation refBody
 */
type RefBodyParams = {
    /**
     * A request body shared through components.requestBodies.
     */
    body: Payload;
  };

@Injectable()
export class BodiesService extends ApiBaseService {
  private static readonly JSON_BODY_PATH = '/json';
  private static readonly OPTIONAL_JSON_BODY_PATH = '/json-optional';
  private static readonly INLINE_JSON_BODY_PATH = '/json-inline';
  private static readonly ARRAY_JSON_BODY_PATH = '/json-array';
  private static readonly PRIMITIVE_JSON_BODY_PATH = '/json-primitive';
  private static readonly TEXT_BODY_PATH = '/text';
  private static readonly BINARY_BODY_PATH = '/binary';
  private static readonly ANY_BODY_PATH = '/any';
  private static readonly MULTI_CONTENT_BODY_PATH = '/multi-content';
  private static readonly FORM_BODY_PATH = '/form';
  private static readonly DESCRIBED_BODY_PATH = '/described-body';
  private static readonly REF_BODY_PATH = '/ref-body';

  public jsonBody(params: JsonBodyParams, context?: HttpContext): AbortablePromise<JsonBodyApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, BodiesService.JSON_BODY_PATH, 'post');
    rb.body(params.body, 'application/json');

    return waitForResponse<JsonBodyApiResponse>(
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

  public optionalJsonBody(params?: OptionalJsonBodyParams, context?: HttpContext): AbortablePromise<OptionalJsonBodyApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, BodiesService.OPTIONAL_JSON_BODY_PATH, 'post');
    if (params) {
      rb.body(params.body, 'application/json');
    }

    return waitForResponse<OptionalJsonBodyApiResponse>(
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

  public inlineJsonBody(params: InlineJsonBodyParams, context?: HttpContext): AbortablePromise<InlineJsonBodyApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, BodiesService.INLINE_JSON_BODY_PATH, 'post');
    rb.body(params.body, 'application/json');

    return waitForResponse<InlineJsonBodyApiResponse>(
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

  public arrayJsonBody(params: ArrayJsonBodyParams, context?: HttpContext): AbortablePromise<ArrayJsonBodyApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, BodiesService.ARRAY_JSON_BODY_PATH, 'post');
    rb.body(params.body, 'application/json');

    return waitForResponse<ArrayJsonBodyApiResponse>(
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

  public primitiveJsonBody(params: PrimitiveJsonBodyParams, context?: HttpContext): AbortablePromise<PrimitiveJsonBodyApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, BodiesService.PRIMITIVE_JSON_BODY_PATH, 'post');
    rb.body(params.body, 'application/json');

    return waitForResponse<PrimitiveJsonBodyApiResponse>(
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

  public textBody(params: TextBodyParams, context?: HttpContext): AbortablePromise<TextBodyApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, BodiesService.TEXT_BODY_PATH, 'post');
    rb.body(params.body, 'text/plain');

    return waitForResponse<TextBodyApiResponse>(
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

  public binaryBody(params: BinaryBodyParams, context?: HttpContext): AbortablePromise<BinaryBodyApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, BodiesService.BINARY_BODY_PATH, 'post');
    rb.body(params.body, 'application/octet-stream');

    return waitForResponse<BinaryBodyApiResponse>(
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

  public anyBody(params: AnyBodyParams, context?: HttpContext): AbortablePromise<AnyBodyApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, BodiesService.ANY_BODY_PATH, 'post');
    rb.body(params.body, '*/*');

    return waitForResponse<AnyBodyApiResponse>(
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

  public multiContentBody(params: MultiContentBodyParams, context?: HttpContext): AbortablePromise<MultiContentBodyApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, BodiesService.MULTI_CONTENT_BODY_PATH, 'post');
    rb.body(params.body, 'application/json');

    return waitForResponse<MultiContentBodyApiResponse>(
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

  public formBody(params: FormBodyParams, context?: HttpContext): AbortablePromise<FormBodyApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, BodiesService.FORM_BODY_PATH, 'post');
    rb.body(params.body, 'application/x-www-form-urlencoded');

    return waitForResponse<FormBodyApiResponse>(
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

  public describedBody(params: DescribedBodyParams, context?: HttpContext): AbortablePromise<DescribedBodyApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, BodiesService.DESCRIBED_BODY_PATH, 'post');
    rb.body(params.body, 'application/json');

    return waitForResponse<DescribedBodyApiResponse>(
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

  public refBody(params: RefBodyParams, context?: HttpContext): AbortablePromise<RefBodyApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, BodiesService.REF_BODY_PATH, 'post');
    rb.body(params.body, 'application/json');

    return waitForResponse<RefBodyApiResponse>(
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
