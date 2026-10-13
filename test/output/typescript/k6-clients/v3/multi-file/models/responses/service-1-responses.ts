import { JSONValue } from 'k6';
import { Response } from 'k6/http';

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
    | ((Omit<Response, 'json'>) & ({
          status: 200;
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

