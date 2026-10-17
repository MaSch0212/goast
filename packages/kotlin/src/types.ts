import type { ApiParameter } from '@goast/core';

/**
 * An API parameter that can carry the form part it is sent as in a `multipart/form-data` request body.
 * @see ApiParameter
 */
export type ApiParameterWithMultipartInfo = ApiParameter & { multipart?: { name: string; isFile: boolean } };
