import { ktReference } from '../nodes/reference';

// org.springframework.beans.factory.annotation
export const autowired = ktReference.factory('Autowired', 'org.springframework.beans.factory.annotation');

// org.springframework.http
export const httpStatus = ktReference.factory('HttpStatus', 'org.springframework.http');
export const responseEntity = ktReference.genericFactory<1>('ResponseEntity', 'org.springframework.http');

// org.springframework.http.codec.multipart
export const filePart = ktReference.factory('FilePart', 'org.springframework.http.codec.multipart');

// org.springframework.stereotype
export const controller = ktReference.factory('Controller', 'org.springframework.stereotype');

// org.springframework.validation.annotation
export const validated = ktReference.factory('Validated', 'org.springframework.validation.annotation');

// org.springframework.web.bind.annotation
export const pathVariable = ktReference.factory('PathVariable', 'org.springframework.web.bind.annotation');
export const requestBody = ktReference.factory('RequestBody', 'org.springframework.web.bind.annotation');
export const requestMapping = ktReference.factory('RequestMapping', 'org.springframework.web.bind.annotation');
export const requestMethod = ktReference.factory('RequestMethod', 'org.springframework.web.bind.annotation');
export const requestParam = ktReference.factory('RequestParam', 'org.springframework.web.bind.annotation');
export const requestPart = ktReference.factory('RequestPart', 'org.springframework.web.bind.annotation');

// org.springframework.web.context.request
export const nativeWebRequest = ktReference.factory('NativeWebRequest', 'org.springframework.web.context.request');
