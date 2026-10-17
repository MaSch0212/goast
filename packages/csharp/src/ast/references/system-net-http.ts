import { csReference, type CsReferenceFactory } from '../nodes/reference.ts';

// System.Net
export const httpStatusCode: CsReferenceFactory = csReference.factory('HttpStatusCode', 'System.Net');

// System.Net.Http
export const httpClient: CsReferenceFactory = csReference.factory('HttpClient', 'System.Net.Http');
export const httpRequestMessage: CsReferenceFactory = csReference.factory('HttpRequestMessage', 'System.Net.Http');
export const httpResponseMessage: CsReferenceFactory = csReference.factory('HttpResponseMessage', 'System.Net.Http');
export const httpMethod: CsReferenceFactory = csReference.factory('HttpMethod', 'System.Net.Http');
export const httpContent: CsReferenceFactory = csReference.factory('HttpContent', 'System.Net.Http');
export const stringContent: CsReferenceFactory = csReference.factory('StringContent', 'System.Net.Http');
export const streamContent: CsReferenceFactory = csReference.factory('StreamContent', 'System.Net.Http');
export const byteArrayContent: CsReferenceFactory = csReference.factory('ByteArrayContent', 'System.Net.Http');
export const multipartFormDataContent: CsReferenceFactory = csReference.factory(
  'MultipartFormDataContent',
  'System.Net.Http',
);
export const formUrlEncodedContent: CsReferenceFactory = csReference.factory(
  'FormUrlEncodedContent',
  'System.Net.Http',
);
export const httpRequestException: CsReferenceFactory = csReference.factory('HttpRequestException', 'System.Net.Http');
export const httpCompletionOption: CsReferenceFactory = csReference.factory('HttpCompletionOption', 'System.Net.Http');

// System.Net.Http.Json
export const httpClientJsonExtensions: CsReferenceFactory = csReference.factory(
  'HttpClientJsonExtensions',
  'System.Net.Http.Json',
);
export const jsonContent: CsReferenceFactory = csReference.factory('JsonContent', 'System.Net.Http.Json');

// System.Net.Http.Headers
export const mediaTypeHeaderValue: CsReferenceFactory = csReference.factory(
  'MediaTypeHeaderValue',
  'System.Net.Http.Headers',
);
export const authenticationHeaderValue: CsReferenceFactory = csReference.factory(
  'AuthenticationHeaderValue',
  'System.Net.Http.Headers',
);
