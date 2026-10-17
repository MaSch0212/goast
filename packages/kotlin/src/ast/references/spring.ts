/**
 * Pre-built references to well-known Spring Framework types.
 *
 * Each `export const` is a factory that creates a `KtReference` with the given name and package, so the
 * generated code imports the type automatically. See `KtReferenceFactory` for the optional `options`, and
 * `KtGenericReferenceFactory` for the type-argument tuple that generic factories take first.
 */

import { type KtGenericReferenceFactory, ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// org.springframework.beans.factory.annotation
/** Reference to `Autowired` from the `org.springframework.beans.factory.annotation` package. */
export const autowired: KtReferenceFactory = ktReference.factory(
  'Autowired',
  'org.springframework.beans.factory.annotation',
);

// org.springframework.http
/** Reference to `HttpStatus` from the `org.springframework.http` package. */
export const httpStatus: KtReferenceFactory = ktReference.factory('HttpStatus', 'org.springframework.http');
/** Reference to `HttpMethod` from the `org.springframework.http` package. */
export const httpMethod: KtReferenceFactory = ktReference.factory('HttpMethod', 'org.springframework.http');
/** Generic reference to `ResponseEntity` from the `org.springframework.http` package, taking one type argument. */
export const responseEntity: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>(
  'ResponseEntity',
  'org.springframework.http',
);
/** Reference to `MediaType` from the `org.springframework.http` package. */
export const mediaType: KtReferenceFactory = ktReference.factory('MediaType', 'org.springframework.http');

// org.springframework.http.client
/** Reference to `MultipartBodyBuilder` from the `org.springframework.http.client` package. */
export const multipartBodyBuilder: KtReferenceFactory = ktReference.factory(
  'MultipartBodyBuilder',
  'org.springframework.http.client',
);

// org.springframework.http.codec.multipart
/** Reference to `FilePart` from the `org.springframework.http.codec.multipart` package. */
export const filePart: KtReferenceFactory = ktReference.factory('FilePart', 'org.springframework.http.codec.multipart');

// org.springframework.stereotype
/** Reference to `Controller` from the `org.springframework.stereotype` package. */
export const controller: KtReferenceFactory = ktReference.factory('Controller', 'org.springframework.stereotype');

// org.springframework.util
/** Generic reference to `MultiValueMap` from the `org.springframework.util` package, taking two type arguments. */
export const multiValueMap: KtGenericReferenceFactory<2> = ktReference.genericFactory<2>(
  'MultiValueMap',
  'org.springframework.util',
);
/** Generic reference to `LinkedMultiValueMap` from `org.springframework.util`, taking two type arguments. */
export const linkedMultiValueMap: KtGenericReferenceFactory<2> = ktReference.genericFactory<2>(
  'LinkedMultiValueMap',
  'org.springframework.util',
);

// org.springframework.validation.annotation
/** Reference to `Validated` from the `org.springframework.validation.annotation` package. */
export const validated: KtReferenceFactory = ktReference.factory(
  'Validated',
  'org.springframework.validation.annotation',
);

// org.springframework.web.bind.annotation
/** Reference to `PathVariable` from the `org.springframework.web.bind.annotation` package. */
export const pathVariable: KtReferenceFactory = ktReference.factory(
  'PathVariable',
  'org.springframework.web.bind.annotation',
);
/** Reference to `RequestBody` from the `org.springframework.web.bind.annotation` package. */
export const requestBody: KtReferenceFactory = ktReference.factory(
  'RequestBody',
  'org.springframework.web.bind.annotation',
);
/** Reference to `RequestMapping` from the `org.springframework.web.bind.annotation` package. */
export const requestMapping: KtReferenceFactory = ktReference.factory(
  'RequestMapping',
  'org.springframework.web.bind.annotation',
);
/** Reference to `RequestMethod` from the `org.springframework.web.bind.annotation` package. */
export const requestMethod: KtReferenceFactory = ktReference.factory(
  'RequestMethod',
  'org.springframework.web.bind.annotation',
);
/** Reference to `RequestParam` from the `org.springframework.web.bind.annotation` package. */
export const requestParam: KtReferenceFactory = ktReference.factory(
  'RequestParam',
  'org.springframework.web.bind.annotation',
);
/** Reference to `RequestPart` from the `org.springframework.web.bind.annotation` package. */
export const requestPart: KtReferenceFactory = ktReference.factory(
  'RequestPart',
  'org.springframework.web.bind.annotation',
);
/** Reference to `RequestHeader` from the `org.springframework.web.bind.annotation` package. */
export const requestHeader: KtReferenceFactory = ktReference.factory(
  'RequestHeader',
  'org.springframework.web.bind.annotation',
);

// org.springframework.web.context.request
/** Reference to `NativeWebRequest` from the `org.springframework.web.context.request` package. */
export const nativeWebRequest: KtReferenceFactory = ktReference.factory(
  'NativeWebRequest',
  'org.springframework.web.context.request',
);

// org.springframework.web.util
/** Reference to `UriComponentsBuilder` from the `org.springframework.web.util` package. */
export const uriComponentsBuilder: KtReferenceFactory = ktReference.factory(
  'UriComponentsBuilder',
  'org.springframework.web.util',
);
