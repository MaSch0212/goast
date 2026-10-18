import {
  type TsGenericModuleReferenceFactory,
  type TsModuleReferenceFactory,
  tsReference,
} from '../nodes/reference.ts';

// @angular/core
/** Reference to `inject` from the `@angular/core` module. */
export const inject: TsModuleReferenceFactory = tsReference.factory('inject', '@angular/core');
/** Reference to `Injectable` from the `@angular/core` module. */
export const injectable: TsModuleReferenceFactory = tsReference.factory('Injectable', '@angular/core');
/** Reference to `Provider` from the `@angular/core` module, imported as a type. */
export const provider: TsModuleReferenceFactory = tsReference.factory('Provider', '@angular/core', {
  importType: 'type-import',
});

// @angular/common/http
/** Reference to `HttpClient` from the `@angular/common/http` module. */
export const httpClient: TsModuleReferenceFactory = tsReference.factory('HttpClient', '@angular/common/http');
/** Reference to `HttpContext` from the `@angular/common/http` module. */
export const httpContext: TsModuleReferenceFactory = tsReference.factory('HttpContext', '@angular/common/http');
/** Reference to `HttpResponse` from the `@angular/common/http` module. Takes one type argument. */
export const httpResponse: TsGenericModuleReferenceFactory<1> = tsReference.genericFactory<1>(
  'HttpResponse',
  '@angular/common/http',
);
/** Reference to `HttpErrorResponse` from the `@angular/common/http` module. */
export const httpErrorResponse: TsModuleReferenceFactory = tsReference.factory(
  'HttpErrorResponse',
  '@angular/common/http',
);
