import { SourceBuilder, StringBuilder, defaultOpenApiGeneratorConfig } from '@goast/core';

import { TypeScriptGeneratorConfig, defaultTypeScriptGeneratorConfig } from '../../config';
import { TypeScriptFileBuilder } from '../../file-builder';

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
