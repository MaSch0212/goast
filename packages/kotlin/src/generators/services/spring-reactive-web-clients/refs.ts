import { kt } from '../../../ast/index.ts';

// See packages/kotlin/assets/client/spring-reactive-web-clients for reference
/**
 * Creates the reference factories used by the Spring WebFlux client generators.
 *
 * @param infrastructurePackageName The package the shared `ApiRequestFile` helper is written to and imported from.
 * @returns The reference factories, with `apiRequestFile` referencing `ApiRequestFile` in that package.
 * @see KotlinSpringReactiveWebClientsGeneratorConfig.infrastructurePackageName
 */
export function getReferenceFactories(infrastructurePackageName: string): {
  apiRequestFile: kt.ReferenceFactory;
} {
  return {
    // ApiRequestFile.kt
    apiRequestFile: kt.reference.factory('ApiRequestFile', infrastructurePackageName),
  };
}
