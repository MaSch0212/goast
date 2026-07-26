import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

type TwoTagsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation twoTags
 */
export type TwoTagsApiResponse<TStatus extends TwoTagsStatusCodes = TwoTagsStatusCodes> = (
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

