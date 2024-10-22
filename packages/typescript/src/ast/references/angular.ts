import {
  type TsGenericModuleReferenceFactory,
  type TsModuleReferenceFactory,
  tsReference,
} from '../nodes/reference.ts';

// @angular/core
export const inject: TsModuleReferenceFactory = tsReference.factory('inject', '@angular/core');
export const injectable: TsModuleReferenceFactory = tsReference.factory('Injectable', '@angular/core');
export const provider: TsModuleReferenceFactory = tsReference.factory('Provider', '@angular/core', {
  importType: 'type-import',
});

// @angular/common/http
export const httpClient: TsModuleReferenceFactory = tsReference.factory('HttpClient', '@angular/common/http');
export const httpContext: TsModuleReferenceFactory = tsReference.factory('HttpContext', '@angular/common/http');
export const httpResponse: TsGenericModuleReferenceFactory<1> = tsReference.genericFactory<1>(
  'HttpResponse',
  '@angular/common/http',
);
export const httpErrorResponse: TsModuleReferenceFactory = tsReference.factory(
  'HttpErrorResponse',
  '@angular/common/http',
);
