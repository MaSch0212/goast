import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { Payload } from '../models/payload';
import type { FileAndFieldsApiResponse, MultipleFilesApiResponse, NestedObjectPartApiResponse, OptionalFileApiResponse, RefPartApiResponse, SingleFileApiResponse, WithEncodingApiResponse } from '../models/responses/multipart-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation singleFile
 */
type SingleFileParams = {
    body: {
      file: Blob;
    };
  };

/**
 * Parameters for operation multipleFiles
 */
type MultipleFilesParams = {
    body: {
      files?: (Blob)[];
    };
  };

/**
 * Parameters for operation fileAndFields
 */
type FileAndFieldsParams = {
    body: {
      file?: Blob;
      label?: string;
      quantity?: number;
      active?: boolean;
    };
  };

/**
 * Parameters for operation nestedObjectPart
 */
type NestedObjectPartParams = {
    body: {
      metadata?: {
        author?: string;
        version?: number;
      };
    };
  };

/**
 * Parameters for operation refPart
 */
type RefPartParams = {
    body: {
      payload?: Payload;
    };
  };

/**
 * Parameters for operation withEncoding
 */
type WithEncodingParams = {
    body: {
      file?: Blob;
      label?: string;
      quantity?: number;
      active?: boolean;
    };
  };

/**
 * Parameters for operation optionalFile
 */
type OptionalFileParams = {
    body: {
      file?: Blob;
    };
  };

@Injectable()
export class MultipartService extends ApiBaseService {
  private static readonly SINGLE_FILE_PATH = '/file';
  private static readonly MULTIPLE_FILES_PATH = '/files';
  private static readonly FILE_AND_FIELDS_PATH = '/mixed';
  private static readonly NESTED_OBJECT_PART_PATH = '/nested';
  private static readonly REF_PART_PATH = '/ref-part';
  private static readonly WITH_ENCODING_PATH = '/encoded';
  private static readonly OPTIONAL_FILE_PATH = '/optional-file';

  public singleFile(params: SingleFileParams, context?: HttpContext): AbortablePromise<SingleFileApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, MultipartService.SINGLE_FILE_PATH, 'post');
    rb.body(params.body, 'multipart/form-data');

    return waitForResponse<SingleFileApiResponse>(
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

  public multipleFiles(params: MultipleFilesParams, context?: HttpContext): AbortablePromise<MultipleFilesApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, MultipartService.MULTIPLE_FILES_PATH, 'post');
    rb.body(params.body, 'multipart/form-data');

    return waitForResponse<MultipleFilesApiResponse>(
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

  public fileAndFields(params: FileAndFieldsParams, context?: HttpContext): AbortablePromise<FileAndFieldsApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, MultipartService.FILE_AND_FIELDS_PATH, 'post');
    rb.body(params.body, 'multipart/form-data');

    return waitForResponse<FileAndFieldsApiResponse>(
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

  public nestedObjectPart(params: NestedObjectPartParams, context?: HttpContext): AbortablePromise<NestedObjectPartApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, MultipartService.NESTED_OBJECT_PART_PATH, 'post');
    rb.body(params.body, 'multipart/form-data');

    return waitForResponse<NestedObjectPartApiResponse>(
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

  public refPart(params: RefPartParams, context?: HttpContext): AbortablePromise<RefPartApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, MultipartService.REF_PART_PATH, 'post');
    rb.body(params.body, 'multipart/form-data');

    return waitForResponse<RefPartApiResponse>(
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

  public withEncoding(params: WithEncodingParams, context?: HttpContext): AbortablePromise<WithEncodingApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, MultipartService.WITH_ENCODING_PATH, 'post');
    rb.body(params.body, 'multipart/form-data');

    return waitForResponse<WithEncodingApiResponse>(
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

  public optionalFile(params: OptionalFileParams, context?: HttpContext): AbortablePromise<OptionalFileApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, MultipartService.OPTIONAL_FILE_PATH, 'post');
    rb.body(params.body, 'multipart/form-data');

    return waitForResponse<OptionalFileApiResponse>(
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
