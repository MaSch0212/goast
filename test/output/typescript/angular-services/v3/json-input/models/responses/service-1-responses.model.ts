import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

import type { Thing } from '../thing';

type ListThingsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation listThings
 */
export type ListThingsApiResponse<TStatus extends ListThingsStatusCodes = ListThingsStatusCodes> = (
    | ((HttpResponse<(Thing)[]>) & ({
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

