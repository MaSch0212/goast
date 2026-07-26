import { JSONValue } from 'k6';
import { Response } from 'k6/http';

type SingleFileStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation singleFile
 */
export type SingleFileApiResponse<TStatus extends SingleFileStatusCodes = SingleFileStatusCodes> = (
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

type MultipleFilesStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation multipleFiles
 */
export type MultipleFilesApiResponse<TStatus extends MultipleFilesStatusCodes = MultipleFilesStatusCodes> = (
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

type FileAndFieldsStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation fileAndFields
 */
export type FileAndFieldsApiResponse<TStatus extends FileAndFieldsStatusCodes = FileAndFieldsStatusCodes> = (
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

type NestedObjectPartStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation nestedObjectPart
 */
export type NestedObjectPartApiResponse<TStatus extends NestedObjectPartStatusCodes = NestedObjectPartStatusCodes> = (
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

type RefPartStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation refPart
 */
export type RefPartApiResponse<TStatus extends RefPartStatusCodes = RefPartStatusCodes> = (
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

type WithEncodingStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation withEncoding
 */
export type WithEncodingApiResponse<TStatus extends WithEncodingStatusCodes = WithEncodingStatusCodes> = (
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

type OptionalFileStatusCodes =
  | (200)
  | (401)
  | (403)
  | (500);
/**
 * Response model for operation optionalFile
 */
export type OptionalFileApiResponse<TStatus extends OptionalFileStatusCodes = OptionalFileStatusCodes> = (
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

