import { OpenApiGenerationProviderContext, OpenApiGeneratorInput, SourceBuilder } from '@goast/core';

import { ts } from '../ast';
import { TypeScriptGeneratorConfig } from '../config';

export abstract class TypeScriptFileGenerator<
  TContext extends OpenApiGenerationProviderContext<OpenApiGeneratorInput, TypeScriptGeneratorConfig>,
  TOutput,
> {
  public abstract generate(context: TContext): TOutput;

  protected getAnyType(context: TContext): ts.Reference<SourceBuilder> {
    return context.config.preferUnknown ? ts.refs.unknown() : ts.refs.any();
  }
}
