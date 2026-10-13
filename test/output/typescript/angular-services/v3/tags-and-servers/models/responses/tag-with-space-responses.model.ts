import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

type TagWithSpaceStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation tagWithSpace
 */
export type TagWithSpaceApiResponse<TStatus extends TagWithSpaceStatusCodes = TagWithSpaceStatusCodes> = (
    | ((HttpResponse<unknown>) & ({
          status: 200;
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

