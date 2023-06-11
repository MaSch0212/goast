import { DefaultGenerationProviderConfig, OpenApiGenerationProviderBase } from './generator';
import { addSourceIfTest } from './internal-utils';
import {
  AnyConfig,
  OpenApiGenerationProviderContext,
  OpenApiGeneratorContext,
  OpenApiGeneratorInput,
  OpenApiGeneratorOutput,
} from './types';
import { ApiSchema } from '../transform';
import { getSchemaReference } from '../utils';

export type OpenApiSchemasGenerationProviderContext<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TSchemaOutput extends OpenApiGeneratorOutput
> = OpenApiGenerationProviderContext<TInput, TConfig> & {
  existingSchemaResults: Map<string, TSchemaOutput>;
  output: TOutput;
};

export abstract class OpenApiSchemasGenerationProviderBase<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TSchemaOutput extends OpenApiGeneratorOutput,
  TContext extends OpenApiSchemasGenerationProviderContext<TInput, TOutput, TConfig, TSchemaOutput>
> extends OpenApiGenerationProviderBase<TInput, TOutput, TConfig, TContext> {
  protected override getProviderContext(
    context: OpenApiGeneratorContext<TInput>,
    config: Partial<TConfig> | undefined,
    defaultConfig: DefaultGenerationProviderConfig<TConfig>
  ): OpenApiSchemasGenerationProviderContext<TInput, TOutput, TConfig, TSchemaOutput> {
    const ctx = super.getProviderContext(context, config, defaultConfig);
    return Object.assign(ctx, {
      existingSchemaResults: new Map<string, TSchemaOutput>(),
      output: this.initResult(ctx),
    });
  }

  protected override onGenerate(ctx: TContext): TOutput {
    for (const schema of ctx.data.schemas) {
      this.getSchemaResult(ctx, schema);
    }

    return ctx.output;
  }

  public getSchemaResult(ctx: TContext, schema: ApiSchema): TSchemaOutput {
    const existingResult = ctx.existingSchemaResults.get(schema.id);
    if (existingResult) return existingResult;

    let result: TSchemaOutput;
    const reference = this.getSchemaReference(ctx, schema);
    if (reference) {
      result = this.getSchemaResult(ctx, reference);
    } else {
      result = this.generateSchema(ctx, schema);
    }

    addSourceIfTest(ctx.config, result, () => `${schema.$src.file}#${schema.$src.path}`);
    this.addSchemaResult(ctx, schema, result);
    return result;
  }

  protected getSchemaReference(ctx: TContext, schema: ApiSchema): ApiSchema | undefined {
    const ref = getSchemaReference(schema, ['description']);
    return ref.id !== schema.id ? ref : undefined;
  }

  protected abstract initResult(ctx: OpenApiGenerationProviderContext<TInput, TConfig>): TOutput;

  protected abstract generateSchema(ctx: TContext, schema: ApiSchema): TSchemaOutput;

  protected abstract addSchemaResult(ctx: TContext, schema: ApiSchema, result: TSchemaOutput): void;
}
