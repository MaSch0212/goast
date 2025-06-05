import { type KtGenericReferenceFactory, ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// org.springframework.beans.factory.annotation
export const autowired: KtReferenceFactory = ktReference.factory(
  'Autowired',
  'org.springframework.beans.factory.annotation',
);

// org.springframework.http
export const httpStatus: KtReferenceFactory = ktReference.factory('HttpStatus', 'org.springframework.http');
export const httpMethod: KtReferenceFactory = ktReference.factory('HttpMethod', 'org.springframework.http');
export const responseEntity: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>(
  'ResponseEntity',
  'org.springframework.http',
);
export const mediaType: KtReferenceFactory = ktReference.factory('MediaType', 'org.springframework.http');

// org.springframework.http.client
export const multipartBodyBuilder: KtReferenceFactory = ktReference.factory(
  'MultipartBodyBuilder',
  'org.springframework.http.client',
);

// org.springframework.http.codec.multipart
export const filePart: KtReferenceFactory = ktReference.factory('FilePart', 'org.springframework.http.codec.multipart');

// org.springframework.stereotype
export const controller: KtReferenceFactory = ktReference.factory('Controller', 'org.springframework.stereotype');

// org.springframework.util
export const multiValueMap: KtGenericReferenceFactory<2> = ktReference.genericFactory<2>(
  'MultiValueMap',
  'org.springframework.util',
);
export const linkedMultiValueMap: KtGenericReferenceFactory<2> = ktReference.genericFactory<2>(
  'LinkedMultiValueMap',
  'org.springframework.util',
);

// org.springframework.validation.annotation
export const validated: KtReferenceFactory = ktReference.factory(
  'Validated',
  'org.springframework.validation.annotation',
);

// org.springframework.web.bind.annotation
export const pathVariable: KtReferenceFactory = ktReference.factory(
  'PathVariable',
  'org.springframework.web.bind.annotation',
);
export const requestBody: KtReferenceFactory = ktReference.factory(
  'RequestBody',
  'org.springframework.web.bind.annotation',
);
export const requestMapping: KtReferenceFactory = ktReference.factory(
  'RequestMapping',
  'org.springframework.web.bind.annotation',
);
export const requestMethod: KtReferenceFactory = ktReference.factory(
  'RequestMethod',
  'org.springframework.web.bind.annotation',
);
export const requestParam: KtReferenceFactory = ktReference.factory(
  'RequestParam',
  'org.springframework.web.bind.annotation',
);
export const requestPart: KtReferenceFactory = ktReference.factory(
  'RequestPart',
  'org.springframework.web.bind.annotation',
);
export const requestHeader: KtReferenceFactory = ktReference.factory(
  'RequestHeader',
  'org.springframework.web.bind.annotation',
);

// org.springframework.web.context.request
export const nativeWebRequest: KtReferenceFactory = ktReference.factory(
  'NativeWebRequest',
  'org.springframework.web.context.request',
);

// org.springframework.web.util
export const uriComponentsBuilder: KtReferenceFactory = ktReference.factory(
  'UriComponentsBuilder',
  'org.springframework.web.util',
);
