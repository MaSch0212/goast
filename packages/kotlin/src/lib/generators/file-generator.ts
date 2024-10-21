import {
  type MaybePromise,
  type Nullable,
  type OpenApiGenerationProviderContext,
  type OpenApiGeneratorInput,
  toCasing,
} from '@goast/core';

import type { KotlinGeneratorConfig } from '../config.ts';
import { toKotlinPropertyName, toKotlinStringLiteral } from '../utils.ts';

export abstract class KotlinFileGenerator<
  TContext extends OpenApiGenerationProviderContext<OpenApiGeneratorInput, KotlinGeneratorConfig>,
  TOutput,
> {
  public abstract generate(context: TContext): MaybePromise<TOutput>;

  protected toPropertyName(context: TContext, name: string): string {
    return toKotlinPropertyName(toCasing(name, context.config.propertyNameCasing));
  }

  protected toEnumValueName(context: TContext, name: string): string {
    return toKotlinPropertyName(toCasing(name, context.config.enumValueNameCasing));
  }

  protected toStringLiteral(_context: TContext, text: Nullable<string>): string {
    return toKotlinStringLiteral(text);
  }
}
