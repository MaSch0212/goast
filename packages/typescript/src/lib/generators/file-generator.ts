import type { MaybePromise, OpenApiGenerationProviderContext, OpenApiGeneratorInput, SourceBuilder } from '@goast/core';

import { ts } from '../ast/index.ts';
import type { TypeScriptGeneratorConfig } from '../config.ts';

export abstract class TypeScriptFileGenerator<
  TContext extends OpenApiGenerationProviderContext<OpenApiGeneratorInput, TypeScriptGeneratorConfig>,
  TOutput,
> {
  public abstract generate(context: TContext): MaybePromise<TOutput>;

  protected getAnyType(context: TContext): ts.Reference<SourceBuilder> {
    return context.config.preferUnknown ? ts.refs.unknown() : ts.refs.any();
  }
}
