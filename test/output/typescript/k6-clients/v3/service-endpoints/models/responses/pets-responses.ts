import { JSONValue } from 'k6';
import { Response } from 'k6/http';

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
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): (Pet)[];
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
  | (400)
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
          status: 400;
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
          status: 404;
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
    | ((Omit<Response, 'json'>) & ({
          status: 200;
          json(): Pet;
          json(selector: string): JSONValue;
        }))
    | ((Omit<Response, 'json'>) & ({
          status: 202;
          json(): Owner;
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

