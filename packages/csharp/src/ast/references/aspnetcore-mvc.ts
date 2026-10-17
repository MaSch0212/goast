import { csReference, type CsReferenceFactory } from '../nodes/reference.ts';

// Microsoft.AspNetCore.Mvc
export const controllerBase: CsReferenceFactory = csReference.factory('ControllerBase', 'Microsoft.AspNetCore.Mvc');
export const apiController: CsReferenceFactory = csReference.factory('ApiController', 'Microsoft.AspNetCore.Mvc');
export const route: CsReferenceFactory = csReference.factory('Route', 'Microsoft.AspNetCore.Mvc');
export const httpGet: CsReferenceFactory = csReference.factory('HttpGet', 'Microsoft.AspNetCore.Mvc');
export const httpPost: CsReferenceFactory = csReference.factory('HttpPost', 'Microsoft.AspNetCore.Mvc');
export const httpPut: CsReferenceFactory = csReference.factory('HttpPut', 'Microsoft.AspNetCore.Mvc');
export const httpPatch: CsReferenceFactory = csReference.factory('HttpPatch', 'Microsoft.AspNetCore.Mvc');
export const httpDelete: CsReferenceFactory = csReference.factory('HttpDelete', 'Microsoft.AspNetCore.Mvc');
export const httpHead: CsReferenceFactory = csReference.factory('HttpHead', 'Microsoft.AspNetCore.Mvc');
export const httpOptions: CsReferenceFactory = csReference.factory('HttpOptions', 'Microsoft.AspNetCore.Mvc');
export const fromRoute: CsReferenceFactory = csReference.factory('FromRoute', 'Microsoft.AspNetCore.Mvc');
export const fromQuery: CsReferenceFactory = csReference.factory('FromQuery', 'Microsoft.AspNetCore.Mvc');
export const fromHeader: CsReferenceFactory = csReference.factory('FromHeader', 'Microsoft.AspNetCore.Mvc');
export const fromBody: CsReferenceFactory = csReference.factory('FromBody', 'Microsoft.AspNetCore.Mvc');
export const fromForm: CsReferenceFactory = csReference.factory('FromForm', 'Microsoft.AspNetCore.Mvc');
export const fromServices: CsReferenceFactory = csReference.factory('FromServices', 'Microsoft.AspNetCore.Mvc');
export const iActionResult: CsReferenceFactory = csReference.factory('IActionResult', 'Microsoft.AspNetCore.Mvc');
export const objectResult: CsReferenceFactory = csReference.factory('ObjectResult', 'Microsoft.AspNetCore.Mvc');
export const statusCodeResult: CsReferenceFactory = csReference.factory('StatusCodeResult', 'Microsoft.AspNetCore.Mvc');
export const contentResult: CsReferenceFactory = csReference.factory('ContentResult', 'Microsoft.AspNetCore.Mvc');
export const fileStreamResult: CsReferenceFactory = csReference.factory('FileStreamResult', 'Microsoft.AspNetCore.Mvc');
export const produces: CsReferenceFactory = csReference.factory('Produces', 'Microsoft.AspNetCore.Mvc');
export const producesResponseType: CsReferenceFactory = csReference.factory(
  'ProducesResponseType',
  'Microsoft.AspNetCore.Mvc',
);
export const consumes: CsReferenceFactory = csReference.factory('Consumes', 'Microsoft.AspNetCore.Mvc');
