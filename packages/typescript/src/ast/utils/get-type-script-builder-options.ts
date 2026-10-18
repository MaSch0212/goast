import { defaultOpenApiGeneratorConfig, type SourceBuilder, type StringBuilder } from '@goast/core';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';

const tsConfigSymbol = Symbol();
type _BuilderWithConfig = SourceBuilder & { [tsConfigSymbol]?: TypeScriptGeneratorConfig };

/**
 * Gets the TypeScript generator options that apply to a builder.
 * A `TypeScriptFileBuilder` returns its own options. For any other builder, the options are merged from the OpenAPI
 * defaults, the TypeScript defaults and the builder's own options, in that order, so later sources take precedence.
 * The merged result is also stored on the builder under a private symbol.
 * @param builder The builder to get the options for.
 * @returns The TypeScript generator options for the builder.
 */
export function getTypeScriptBuilderOptions(builder: StringBuilder): TypeScriptGeneratorConfig {
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
