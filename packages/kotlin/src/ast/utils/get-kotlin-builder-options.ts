import { defaultOpenApiGeneratorConfig, type SourceBuilder } from '@goast/core';

import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../config.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';

const ktConfigSymbol = Symbol();
type _BuilderWithConfig = SourceBuilder & { [ktConfigSymbol]?: KotlinGeneratorConfig };

export function getKotlinBuilderOptions(builder: SourceBuilder) {
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
