import { tsReference } from '../nodes/reference';

export const injectable = tsReference.factory('Injectable', '@angular/core');
export const httpClient = tsReference.factory('HttpClient', '@angular/common/http');
export const httpContext = tsReference.factory('HttpContext', '@angular/common/http');
export const httpResponse = tsReference.factory('HttpResponse', '@angular/common/http');
