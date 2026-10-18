import { defaultOpenApiGeneratorConfig, type SourceBuilder } from '@goast/core';

import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../config.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';

const ktConfigSymbol = Symbol();
type _BuilderWithConfig = SourceBuilder & { [ktConfigSymbol]?: KotlinGeneratorConfig };

/**
 * Gets the Kotlin generator configuration that applies to a builder.
 *
 * A `KotlinFileBuilder` returns its own options. For any other builder, the OpenAPI defaults are overridden by the
 * Kotlin defaults, which are overridden by the builder's own options. The merged result is also assigned to the
 * builder under a private symbol key.
 *
 * @param builder The builder to get the configuration for.
 * @returns The Kotlin generator configuration for the builder.
 */
export function getKotlinBuilderOptions(builder: SourceBuilder): KotlinGeneratorConfig {
  if (builder instanceof KotlinFileBuilder) {
    return builder.options;
  }
  if (ktConfigSymbol in builder.options) {
    return builder.options[ktConfigSymbol] as KotlinGeneratorConfig;
  }
  const options = { ...defaultOpenApiGeneratorConfig, ...defaultKotlinGeneratorConfig, ...builder.options };
  (builder as _BuilderWithConfig)[ktConfigSymbol] = options;
  return options;
}
