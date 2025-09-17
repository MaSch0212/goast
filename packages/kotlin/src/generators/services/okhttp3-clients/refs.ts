import { kt } from '../../../ast/index.ts';

// See packages/kotlin/assets/client/okhttp3 for reference
export function getReferenceFactories(infrastructurePackageName: string): {
  multiValueMap: kt.ReferenceFactory;
  collectionDelimiter: kt.ReferenceFactory;
  defaultMultiValueConverter: kt.ReferenceFactory;
  toMultiValueMap: kt.GenericReferenceFactory<1>;
  apiClient: kt.ReferenceFactory;
  responseType: kt.ReferenceFactory;
  apiResponse: kt.GenericReferenceFactory<1>;
  success: kt.GenericReferenceFactory<1>;
  informational: kt.GenericReferenceFactory<1>;
  redirection: kt.GenericReferenceFactory<1>;
  clientError: kt.GenericReferenceFactory<1>;
  serverError: kt.GenericReferenceFactory<1>;
  clientException: kt.ReferenceFactory;
  serverException: kt.ReferenceFactory;
  partConfig: kt.GenericReferenceFactory<1>;
  requestConfig: kt.GenericReferenceFactory<1>;
  requestMethod: kt.ReferenceFactory;
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
