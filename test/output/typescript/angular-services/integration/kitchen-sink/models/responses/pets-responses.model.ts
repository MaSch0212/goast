import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

import type { Pet } from '../pet';

type GetPetStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation getPet
 */
export type GetPetApiResponse<TStatus extends GetPetStatusCodes = GetPetStatusCodes> = (
    | ((HttpResponse<Pet>) & ({
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

