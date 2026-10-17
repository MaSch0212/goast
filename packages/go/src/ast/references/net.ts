import { goReference } from '../nodes/reference.ts';

/** A reference to `http.Handler` of the `net/http` package. */
export const httpHandler = goReference.factory('Handler', 'net/http');
/** A reference to `http.Header` of the `net/http` package. */
export const httpHeader = goReference.factory('Header', 'net/http');
/** A reference to `http.Request` of the `net/http` package. */
export const httpRequest = goReference.factory('Request', 'net/http');
/** A reference to `http.ResponseWriter` of the `net/http` package. */
export const httpResponseWriter = goReference.factory('ResponseWriter', 'net/http');
/** A reference to `http.ServeMux` of the `net/http` package. */
export const httpServeMux = goReference.factory('ServeMux', 'net/http');
