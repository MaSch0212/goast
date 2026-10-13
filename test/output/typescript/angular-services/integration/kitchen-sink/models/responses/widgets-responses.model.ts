import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

import type { Error } from '../error';
import type { Widget } from '../widget';

type GetWidgetStatusCodes =
  | (200)
  | (400)
  | (401)
  | (403)
  | (404)
  | (500);
/**
 * Response model for operation getWidget
 */
export type GetWidgetApiResponse<TStatus extends GetWidgetStatusCodes = GetWidgetStatusCodes> = (
    | ((HttpResponse<Widget>) & ({
          status: 200;
          ok: true;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (Error) | (null);
          status: 400;
          ok: false;
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
          error: (Error) | (null);
          status: 404;
          ok: false;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (Error) | (null);
          status: 500;
          ok: false;
        }))) & ({
      status: TStatus;
    });

