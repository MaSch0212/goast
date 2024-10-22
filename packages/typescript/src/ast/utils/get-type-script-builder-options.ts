import { defaultOpenApiGeneratorConfig, type SourceBuilder, type StringBuilder } from '@goast/core';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';

const tsConfigSymbol = Symbol();
type _BuilderWithConfig = SourceBuilder & { [tsConfigSymbol]?: TypeScriptGeneratorConfig };

export function getTypeScriptBuilderOptions(builder: StringBuilder) {
  if (builder instanceof TypeScriptFileBuilder) {
    return builder.options;
  }
  if (tsConfigSymbol in builder.options) {
    return builder.options[tsConfigSymbol] as TypeScriptGeneratorConfig;
  }
  const options = { ...defaultOpenApiGeneratorConfig, ...defaultTypeScriptGeneratorConfig, ...builder.options };
  (builder as _BuilderWithConfig)[tsConfigSymbol] = options;
  return options;
}
