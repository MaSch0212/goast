import { kt } from '../../../ast';

// See packages/kotlin/assets/client/okhttp3 for reference
export function getReferenceFactories(infrastructurePackageName: string) {
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
  };
}
