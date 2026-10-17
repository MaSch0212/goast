import { csReference, type CsReferenceFactory } from '../nodes/reference.ts';

// Microsoft.AspNetCore.Http
export const iResult: CsReferenceFactory = csReference.factory('IResult', 'Microsoft.AspNetCore.Http');
export const results: CsReferenceFactory = csReference.factory('Results', 'Microsoft.AspNetCore.Http');
export const typedResults: CsReferenceFactory = csReference.factory('TypedResults', 'Microsoft.AspNetCore.Http');
export const httpContext: CsReferenceFactory = csReference.factory('HttpContext', 'Microsoft.AspNetCore.Http');
export const statusCodes: CsReferenceFactory = csReference.factory('StatusCodes', 'Microsoft.AspNetCore.Http');
export const iFormFile: CsReferenceFactory = csReference.factory('IFormFile', 'Microsoft.AspNetCore.Http');
export const iFormFileCollection: CsReferenceFactory = csReference.factory(
  'IFormFileCollection',
  'Microsoft.AspNetCore.Http',
);
export const httpRequest: CsReferenceFactory = csReference.factory('HttpRequest', 'Microsoft.AspNetCore.Http');
export const httpResponse: CsReferenceFactory = csReference.factory('HttpResponse', 'Microsoft.AspNetCore.Http');
