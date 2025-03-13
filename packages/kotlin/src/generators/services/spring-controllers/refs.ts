import { toCasing } from '@goast/core';
import { kt } from '../../../ast/index.ts';
import type { KotlinServicesGeneratorConfig } from './models.ts';

export function getReferenceFactories(options: KotlinServicesGeneratorConfig): {
  apiExceptionHandler: kt.ReferenceFactory;
} {
  const packageSuffix = typeof options.packageSuffix === 'string' ? options.packageSuffix : options.packageSuffix(null);
  const packageName = options.packageName + packageSuffix;

  return {
    apiExceptionHandler: kt.reference.factory(
      toCasing('ApiExceptionHandler', options.typeNameCasing),
      packageName,
    ),
  };
}
