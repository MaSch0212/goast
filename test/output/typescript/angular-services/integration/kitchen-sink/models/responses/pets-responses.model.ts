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

type UpdatePetStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation updatePet
 */
export type UpdatePetApiResponse<TStatus extends UpdatePetStatusCodes = UpdatePetStatusCodes> = (
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

type UploadPetPhotoStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation uploadPetPhoto
 */
export type UploadPetPhotoApiResponse<TStatus extends UploadPetPhotoStatusCodes = UploadPetPhotoStatusCodes> = (
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

type AddPetNoteStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation addPetNote
 */
export type AddPetNoteApiResponse<TStatus extends AddPetNoteStatusCodes = AddPetNoteStatusCodes> = (
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

