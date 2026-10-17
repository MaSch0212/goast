import { goReference } from '../nodes/reference.ts';

export const httpHandler = goReference.factory('Handler', 'net/http');
export const httpHeader = goReference.factory('Header', 'net/http');
export const httpRequest = goReference.factory('Request', 'net/http');
export const httpResponseWriter = goReference.factory('ResponseWriter', 'net/http');
export const httpServeMux = goReference.factory('ServeMux', 'net/http');
