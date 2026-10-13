import { JSONValue } from 'k6';
import { Response } from 'k6/http';

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
    | ((Omit<Response, 'json'>) & ({
          status: 201;
          json(): BlobRef;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 401;
          json(): never;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 403;
          json(): never;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 500;
          json(): never;
          json(selector: string): JSONValue;
        }))) & ({
      status: TStatus;
    });

