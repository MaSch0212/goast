import { JSONValue } from 'k6';
import { Response } from 'k6/http';

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
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): Pet;
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

type UpdatePetStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation updatePet
 */
export type UpdatePetApiResponse<TStatus extends UpdatePetStatusCodes = UpdatePetStatusCodes> = (
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): Pet;
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

type DeletePetStatusCodes =
  | (204)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation deletePet
 */
export type DeletePetApiResponse<TStatus extends DeletePetStatusCodes = DeletePetStatusCodes> = (
    | ((Omit<Response, 'json'>) & ({
          status: 204;
          json(): never;
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

type CreatePetStatusCodes =
  | (201)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation createPet
 */
export type CreatePetApiResponse<TStatus extends CreatePetStatusCodes = CreatePetStatusCodes> = (
    | ((Omit<Response, 'json'>) & ({
          status: 201;
          json(): Pet;
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

type UploadPetPhotoStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation uploadPetPhoto
 */
export type UploadPetPhotoApiResponse<TStatus extends UploadPetPhotoStatusCodes = UploadPetPhotoStatusCodes> = (
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): never;
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

