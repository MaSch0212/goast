import { type CsGenericReferenceFactory, csReference, type CsReferenceFactory } from '../nodes/reference.ts';

// Microsoft.AspNetCore.Http.HttpResults
export const results: CsGenericReferenceFactory<[2, 3, 4, 5, 6]> = csReference.genericFactory<[2, 3, 4, 5, 6]>(
  'Results',
  'Microsoft.AspNetCore.Http.HttpResults',
);
export const ok: CsGenericReferenceFactory<1> = csReference.genericFactory<1>(
  'Ok',
  'Microsoft.AspNetCore.Http.HttpResults',
);
export const notFound: CsReferenceFactory = csReference.factory('NotFound', 'Microsoft.AspNetCore.Http.HttpResults');
export const noContent: CsReferenceFactory = csReference.factory('NoContent', 'Microsoft.AspNetCore.Http.HttpResults');
export const badRequest: CsReferenceFactory = csReference.factory(
  'BadRequest',
  'Microsoft.AspNetCore.Http.HttpResults',
);
