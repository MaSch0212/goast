import { OpenApiGenerationProviderContext, OpenApiGeneratorInput } from '@goast/core';
import { toCasing } from '@goast/core/utils';

import { TypeScriptGeneratorConfig } from '../config';
import { toTypeScriptPropertyName, toTypeScriptStringLiteral } from '../utils';

export abstract class TypeScriptFileGenerator<
  TContext extends OpenApiGenerationProviderContext<OpenApiGeneratorInput, TypeScriptGeneratorConfig>,
  TOutput
> {
  public abstract generate(context: TContext): TOutput;

  protected getAnyType(context: TContext): string {
    return context.config.preferUnknown ? 'unknown' : 'any';
  }

  protected toPropertyName(context: TContext, name: string): string {
    return toTypeScriptPropertyName(toCasing(name, context.config.propertyNameCasing), context.config.useSingleQuotes);
  }

  protected toEnumValueName(context: TContext, name: string): string {
    return toTypeScriptPropertyName(toCasing(name, context.config.enumValueNameCasing), context.config.useSingleQuotes);
  }

  protected toStringLiteral(context: TContext, text: string): string {
    return toTypeScriptStringLiteral(text, context.config.useSingleQuotes);
  }
}