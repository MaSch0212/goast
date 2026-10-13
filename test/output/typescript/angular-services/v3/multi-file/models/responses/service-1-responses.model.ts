import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

import type { Owner } from '../owner';
import type { Pet } from '../pet';

type GetOwnerStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation getOwner
 */
export type GetOwnerApiResponse<TStatus extends GetOwnerStatusCodes = GetOwnerStatusCodes> = (
    | ((HttpResponse<Owner>) & ({
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

type ListPetsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation listPets
 */
export type ListPetsApiResponse<TStatus extends ListPetsStatusCodes = ListPetsStatusCodes> = (
    | ((HttpResponse<(Pet)[]>) & ({
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

type CreatePetStatusCodes =
  | (201)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation createPet
 */
export type CreatePetApiResponse<TStatus extends CreatePetStatusCodes = CreatePetStatusCodes> = (
    | ((HttpResponse<Pet>) & ({
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

