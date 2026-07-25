import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

import type { Owner } from '../owner';
import type { Pet } from '../pet';

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
  | (400)
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
          error: (unknown) | (null);
          status: 500;
          ok: false;
        }))) & ({
      status: TStatus;
    });

type GetPetStatusCodes =
  | (200)
  | (401)
  | (403)
  | (404)
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
          status: 404;
          ok: false;
        }))
    | ((Omit<HttpErrorResponse, 'error'>) & ({
          error: (unknown) | (null);
          status: 500;
          ok: false;
        }))) & ({
      status: TStatus;
    });

type DeletePetStatusCodes =
  | (204)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation deletePet
 */
export type DeletePetApiResponse<TStatus extends DeletePetStatusCodes = DeletePetStatusCodes> = (
    | ((HttpResponse<unknown>) & ({
          status: 204;
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

type SearchPetsStatusCodes =
  | (200)
  | (202)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation searchPets
 */
export type SearchPetsApiResponse<TStatus extends SearchPetsStatusCodes = SearchPetsStatusCodes> = (
    | ((HttpResponse<Pet>) & ({
          status: 200;
          ok: true;
        }))
    | ((HttpResponse<Owner>) & ({
          status: 202;
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

