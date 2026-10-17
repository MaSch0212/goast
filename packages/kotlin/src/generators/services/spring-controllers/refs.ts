import { toCasing } from '@goast/core';
import { kt } from '../../../ast/index.ts';
import type { KotlinServicesGeneratorConfig } from './models.ts';

/**
 * Creates the factories for the references to the types that all services share. These types are written once per
 * run, not once per service, and live in the base package: `packageName` followed by `packageSuffix`.
 *
 * A `packageSuffix` function is called with `null` here, because no service is in scope.
 *
 * @param options The services generator configuration. Uses `packageName`, `packageSuffix` and `typeNameCasing`.
 * @returns The reference factories, keyed by reference name. `apiExceptionHandler` references `ApiExceptionHandler`.
 */
export function getReferenceFactories(options: KotlinServicesGeneratorConfig): {
  apiExceptionHandler: kt.ReferenceFactory;
} {
  const packageSuffix = typeof options.packageSuffix === 'string' ? options.packageSuffix : options.packageSuffix(null);
  const packageName = options.packageName + packageSuffix;

  return {
    apiExceptionHandler: kt.reference.factory(toCasing('ApiExceptionHandler', options.typeNameCasing), packageName),
  };
}
