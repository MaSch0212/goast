import type { MaybePromise, OpenApiGenerationProviderContext, OpenApiGeneratorInput, SourceBuilder } from '@goast/core';

import { ts } from '../ast/index.ts';
import type { TypeScriptGeneratorConfig } from '../config.ts';

/**
 * Base class for the TypeScript generators that turn an OpenAPI generation context into TypeScript files.
 *
 * It only provides shared helpers. Subclasses such as the model and Angular service generators write their own files
 * with `TypeScriptFileBuilder` and return the information that later generators need to reference them.
 *
 * @template TContext The type of the generation context, including the TypeScript generator configuration.
 * @template TOutput The type of the output that `generate` returns.
 */
export abstract class TypeScriptFileGenerator<
  TContext extends OpenApiGenerationProviderContext<OpenApiGeneratorInput, TypeScriptGeneratorConfig>,
  TOutput,
> {
  /**
   * Generates the TypeScript files for the given context and returns the information about them.
   * @param context The generation context, including the TypeScript generator configuration.
   * @returns The output of the generator, or a promise that resolves to it.
   */
  public abstract generate(context: TContext): MaybePromise<TOutput>;

  protected getAnyType(context: TContext): ts.Reference<SourceBuilder> {
    return context.config.preferUnknown ? ts.refs.unknown() : ts.refs.any();
  }
}
