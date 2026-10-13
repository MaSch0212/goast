import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { DeleteItemsIdApiResponse, GetAbcdeApiResponse, GetApiResponse, GetItemsApiResponse, GetItemsIdApiResponse, GetItemsIdSubItemsSubIdApiResponse, GetWithSummaryApiResponse, HeadItemsApiResponse, OptionsItemsApiResponse, PatchItemsIdApiResponse, PostItemsApiResponse, PutItemsIdApiResponse } from '../models/responses/naming-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation getItemsId
 */
type GetItemsIdParams = {
    id: string;
  };

/**
 * Parameters for operation putItemsId
 */
type PutItemsIdParams = {
    id: string;
  };

/**
 * Parameters for operation deleteItemsId
 */
type DeleteItemsIdParams = {
    id: string;
  };

/**
 * Parameters for operation patchItemsId
 */
type PatchItemsIdParams = {
    id: string;
  };

/**
 * Parameters for operation getItemsIdSubItemsSubId
 */
type GetItemsIdSubItemsSubIdParams = {
    id: string;
    subId: string;
  };

@Injectable()
export class NamingService extends ApiBaseService {
  private static readonly GET_ITEMS_PATH = '/items';
  private static readonly POST_ITEMS_PATH = '/items';
  private static readonly OPTIONS_ITEMS_PATH = '/items';
  private static readonly HEAD_ITEMS_PATH = '/items';
  private static readonly GET_ITEMS_ID_PATH = '/items/{id}';
  private static readonly PUT_ITEMS_ID_PATH = '/items/{id}';
  private static readonly DELETE_ITEMS_ID_PATH = '/items/{id}';
  private static readonly PATCH_ITEMS_ID_PATH = '/items/{id}';
  private static readonly GET_ITEMS_ID_SUB_ITEMS_SUB_ID_PATH = '/items/{id}/sub-items/{subId}';
  private static readonly GET_PATH = '/';
  private static readonly GET_ABCDE_PATH = '/a/b/c/d/e';
  private static readonly GET_WITH_SUMMARY_PATH = '/with-summary';

  public getItems(context?: HttpContext): AbortablePromise<GetItemsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, NamingService.GET_ITEMS_PATH, 'get');

    return waitForResponse<GetItemsApiResponse>(
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

  public postItems(context?: HttpContext): AbortablePromise<PostItemsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, NamingService.POST_ITEMS_PATH, 'post');

    return waitForResponse<PostItemsApiResponse>(
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

  public optionsItems(context?: HttpContext): AbortablePromise<OptionsItemsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, NamingService.OPTIONS_ITEMS_PATH, 'options');

    return waitForResponse<OptionsItemsApiResponse>(
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

  public headItems(context?: HttpContext): AbortablePromise<HeadItemsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, NamingService.HEAD_ITEMS_PATH, 'head');

    return waitForResponse<HeadItemsApiResponse>(
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

  public getItemsId(params: GetItemsIdParams, context?: HttpContext): AbortablePromise<GetItemsIdApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, NamingService.GET_ITEMS_ID_PATH, 'get');
    rb.path('id', params.id, {});

    return waitForResponse<GetItemsIdApiResponse>(
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

  public putItemsId(params: PutItemsIdParams, context?: HttpContext): AbortablePromise<PutItemsIdApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, NamingService.PUT_ITEMS_ID_PATH, 'put');
    rb.path('id', params.id, {});

    return waitForResponse<PutItemsIdApiResponse>(
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

  public deleteItemsId(params: DeleteItemsIdParams, context?: HttpContext): AbortablePromise<DeleteItemsIdApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, NamingService.DELETE_ITEMS_ID_PATH, 'delete');
    rb.path('id', params.id, {});

    return waitForResponse<DeleteItemsIdApiResponse>(
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

  public patchItemsId(params: PatchItemsIdParams, context?: HttpContext): AbortablePromise<PatchItemsIdApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, NamingService.PATCH_ITEMS_ID_PATH, 'patch');
    rb.path('id', params.id, {});

    return waitForResponse<PatchItemsIdApiResponse>(
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

  public getItemsIdSubItemsSubId(params: GetItemsIdSubItemsSubIdParams, context?: HttpContext): AbortablePromise<GetItemsIdSubItemsSubIdApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, NamingService.GET_ITEMS_ID_SUB_ITEMS_SUB_ID_PATH, 'get');
    rb.path('id', params.id, {});
    rb.path('subId', params.subId, {});

    return waitForResponse<GetItemsIdSubItemsSubIdApiResponse>(
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

  public get(context?: HttpContext): AbortablePromise<GetApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, NamingService.GET_PATH, 'get');

    return waitForResponse<GetApiResponse>(
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

  public getABCDE(context?: HttpContext): AbortablePromise<GetAbcdeApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, NamingService.GET_ABCDE_PATH, 'get');

    return waitForResponse<GetAbcdeApiResponse>(
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

  public getWithSummary(context?: HttpContext): AbortablePromise<GetWithSummaryApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, NamingService.GET_WITH_SUMMARY_PATH, 'get');

    return waitForResponse<GetWithSummaryApiResponse>(
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
