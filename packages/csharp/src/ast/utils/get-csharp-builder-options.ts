import { defaultOpenApiGeneratorConfig, type SourceBuilder } from '@goast/core';

import { type CSharpGeneratorConfig, defaultCSharpGeneratorConfig } from '../../config.ts';
import { CSharpFileBuilder } from '../../file-builder.ts';

const csConfigSymbol = Symbol();
type _BuilderWithConfig = SourceBuilder & { [csConfigSymbol]?: CSharpGeneratorConfig };

export function getCSharpBuilderOptions(builder: SourceBuilder): CSharpGeneratorConfig {
  if (builder instanceof CSharpFileBuilder) {
    return builder.options;
  }
  if (csConfigSymbol in builder.options) {
    return builder.options[csConfigSymbol] as CSharpGeneratorConfig;
  }
  const options = { ...defaultOpenApiGeneratorConfig, ...defaultCSharpGeneratorConfig, ...builder.options };
  (builder as _BuilderWithConfig)[csConfigSymbol] = options;
  return options;
}
