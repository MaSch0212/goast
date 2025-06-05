import { kt } from '../../../ast/index.ts';

// See packages/kotlin/assets/client/spring-reactive-web-clients for reference
export function getReferenceFactories(infrastructurePackageName: string): {
  apiRequestFile: kt.ReferenceFactory;
} {
  return {
    // ApiRequestFile.kt
    apiRequestFile: kt.reference.factory('ApiRequestFile', infrastructurePackageName),
  };
}
