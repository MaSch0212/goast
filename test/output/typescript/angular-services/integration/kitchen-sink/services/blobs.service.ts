import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { UploadBlobApiResponse } from '../models/responses/blobs-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation uploadBlob
 */
type UploadBlobParams = {
    body: Blob;
  };

@Injectable()
export class BlobsService extends ApiBaseService {
  private static readonly UPLOAD_BLOB_PATH = '/blobs';

  public uploadBlob(params: UploadBlobParams, context?: HttpContext): AbortablePromise<UploadBlobApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, BlobsService.UPLOAD_BLOB_PATH, 'post');
    rb.body(params.body, 'application/octet-stream');

    return waitForResponse<UploadBlobApiResponse>(
      this.http.request(rb.build({
        responseType: 'json',
        accept: 'application/json',
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
