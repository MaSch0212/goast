import { Nullable, OpenApiGenerationProviderContext, OpenApiGeneratorInput, toCasing } from '@goast/core';

import { KotlinGeneratorConfig } from '../config';
import { toKotlinPropertyName, toKotlinStringLiteral } from '../utils';

export abstract class KotlinFileGenerator<
  TContext extends OpenApiGenerationProviderContext<OpenApiGeneratorInput, KotlinGeneratorConfig>,
  TOutput,
> {
  public abstract generate(context: TContext): TOutput;

  protected toPropertyName(context: TContext, name: string): string {
    return toKotlinPropertyName(toCasing(name, context.config.propertyNameCasing));
  }

  protected toEnumValueName(context: TContext, name: string): string {
    return toKotlinPropertyName(toCasing(name, context.config.enumValueNameCasing));
  }

  protected toStringLiteral(context: TContext, text: Nullable<string>): string {
    return toKotlinStringLiteral(text);
  }
}
