import { kt } from '../../../ast/index.ts';

// See packages/kotlin/assets/client/okhttp3 for reference
/**
 * Creates the reference factories for the types of the OkHttp3 client infrastructure. Each factory writes a reference
 * to a type in the infrastructure package, so the generated clients import the types from there.
 *
 * @param infrastructurePackageName The package that the infrastructure files are written to.
 * @returns The reference factories, keyed by the name of the type they refer to.
 */
export function getReferenceFactories(infrastructurePackageName: string): {
  /** The `MultiValueMap` type alias for query and header values. Declared in `ApiAbstractions.kt`. */
  multiValueMap: kt.ReferenceFactory;
  /** The `collectionDelimiter` function, which returns the separator of a collection format. `ApiAbstractions.kt`. */
  collectionDelimiter: kt.ReferenceFactory;
  /** The `defaultMultiValueConverter` value, which converts an item to a string. Declared in `ApiAbstractions.kt`. */
  defaultMultiValueConverter: kt.ReferenceFactory;
  /** The `toMultiValueMap` function. The generator does not use it, and no bundled asset declares it. */
  toMultiValueMap: kt.GenericReferenceFactory<1>;
  /** The `ApiClient` base class that every generated client extends. Declared in `ApiClient.kt`. */
  apiClient: kt.ReferenceFactory;
  /** The `ResponseType` enum that tells the response kinds apart. Declared in `ApiResponse.kt`. */
  responseType: kt.ReferenceFactory;
  /** The generic `ApiResponse<T>` base class of every response. Declared in `ApiResponse.kt`. */
  apiResponse: kt.GenericReferenceFactory<1>;
  /** The generic `Success<T>` response, which holds the response data. Declared in `ApiResponse.kt`. */
  success: kt.GenericReferenceFactory<1>;
  /** The generic `Informational<T>` response. Declared in `ApiResponse.kt`. */
  informational: kt.GenericReferenceFactory<1>;
  /** The generic `Redirection<T>` response. Declared in `ApiResponse.kt`. */
  redirection: kt.GenericReferenceFactory<1>;
  /** The generic `ClientError<T>` response for 4xx status codes. Declared in `ApiResponse.kt`. */
  clientError: kt.GenericReferenceFactory<1>;
  /** The generic `ServerError<T>` response for 5xx status codes. Declared in `ApiResponse.kt`. */
  serverError: kt.GenericReferenceFactory<1>;
  /** The `ClientException` thrown for client error responses. Declared in `Errors.kt`. */
  clientException: kt.ReferenceFactory;
  /** The `ServerException` thrown for server error responses. Declared in `Errors.kt`. */
  serverException: kt.ReferenceFactory;
  /** The generic `PartConfig<T>` of one part of a multipart request. Declared in `PartConfig.kt`. */
  partConfig: kt.GenericReferenceFactory<1>;
  /** The generic `RequestConfig<T>` that describes one request. Declared in `RequestConfig.kt`. */
  requestConfig: kt.GenericReferenceFactory<1>;
  /** The `RequestMethod` enum of HTTP methods. Declared in `RequestMethod.kt`. */
  requestMethod: kt.ReferenceFactory;
  /** The `Serializer` object with the default object mapper. It is generated only for a `'static'` serializer. */
  serializer: kt.ReferenceFactory;
} {
  return {
    // ApiAbstractions.kt
    multiValueMap: kt.reference.factory('MultiValueMap', infrastructurePackageName),
    collectionDelimiter: kt.reference.factory('collectionDelimiter', infrastructurePackageName),
    defaultMultiValueConverter: kt.reference.factory('defaultMultiValueConverter', infrastructurePackageName),
    toMultiValueMap: kt.reference.genericFactory<1>('toMultiValueMap', infrastructurePackageName),

    // ApiClient.kt
    apiClient: kt.reference.factory('ApiClient', infrastructurePackageName),

    // ApiResponse.kt
    responseType: kt.reference.factory('ResponseType', infrastructurePackageName),
    apiResponse: kt.reference.genericFactory<1>('ApiResponse', infrastructurePackageName),
    success: kt.reference.genericFactory<1>('Success', infrastructurePackageName),
    informational: kt.reference.genericFactory<1>('Informational', infrastructurePackageName),
    redirection: kt.reference.genericFactory<1>('Redirection', infrastructurePackageName),
    clientError: kt.reference.genericFactory<1>('ClientError', infrastructurePackageName),
    serverError: kt.reference.genericFactory<1>('ServerError', infrastructurePackageName),

    // Errors.kt
    clientException: kt.reference.factory('ClientException', infrastructurePackageName),
    serverException: kt.reference.factory('ServerException', infrastructurePackageName),

    // PartConfig.kt
    partConfig: kt.reference.genericFactory<1>('PartConfig', infrastructurePackageName),

    // RequestConfig.kt
    requestConfig: kt.reference.genericFactory<1>('RequestConfig', infrastructurePackageName),

    // RequestMethod.kt
    requestMethod: kt.reference.factory('RequestMethod', infrastructurePackageName),

    // Serializer.kt
    serializer: kt.reference.factory('Serializer', infrastructurePackageName),
  };
}
