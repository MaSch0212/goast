import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

import type { BlobRef } from '../blob-ref';

type UploadBlobStatusCodes =
  | (201)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation uploadBlob
 */
export type UploadBlobApiResponse<TStatus extends UploadBlobStatusCodes = UploadBlobStatusCodes> = (
    | ((HttpResponse<BlobRef>) & ({
          status: 201;
          ok: true;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 401;
          ok: false;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 403;
          ok: false;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 500;
          ok: false;
        }))) & ({
      status: TStatus;
    });

