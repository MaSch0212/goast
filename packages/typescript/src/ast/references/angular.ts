import { tsReference } from '../nodes/reference.ts';

// @angular/core
export const inject = tsReference.factory('inject', '@angular/core');
export const injectable = tsReference.factory('Injectable', '@angular/core');
export const provider = tsReference.factory('Provider', '@angular/core', { importType: 'type-import' });

// @angular/common/http
export const httpClient = tsReference.factory('HttpClient', '@angular/common/http');
export const httpContext = tsReference.factory('HttpContext', '@angular/common/http');
export const httpResponse = tsReference.genericFactory<1>('HttpResponse', '@angular/common/http');
export const httpErrorResponse = tsReference.factory('HttpErrorResponse', '@angular/common/http');
