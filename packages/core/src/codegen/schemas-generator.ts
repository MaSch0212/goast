import type { ApiSchema } from '../transform/api-types.ts';
import { getSchemaReference } from '../utils/schema.utils.ts';
import type { MaybePromise } from '../utils/type.utils.ts';
import { type DefaultGenerationProviderConfig, OpenApiGenerationProviderBase } from './generator.ts';
import { addSourceIfTest } from './internal-utils.ts';
import type {
  AnyConfig,
  OpenApiGenerationProviderContext,
  OpenApiGeneratorContext,
  OpenApiGeneratorInput,
  OpenApiGeneratorOutput,
} from './types.ts';

export type OpenApiSchemasGenerationProviderContext<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TSchemaOutput extends OpenApiGeneratorOutput,
> = OpenApiGenerationProviderContext<TInput, TConfig> & {
  existingSchemaResults: Map<string, TSchemaOutput>;
  output: TOutput;
};

export abstract class OpenApiSchemasGenerationProviderBase<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TSchemaOutput extends OpenApiGeneratorOutput,
  TContext extends OpenApiSchemasGenerationProviderContext<TInput, TOutput, TConfig, TSchemaOutput>,
> extends OpenApiGenerationProviderBase<TInput, TOutput, TConfig, TContext> {
  protected override getProviderContext(
    context: OpenApiGeneratorContext<TInput>,
    config: Partial<TConfig> | undefined,
    defaultConfig: DefaultGenerationProviderConfig<TConfig>,
  ): OpenApiSchemasGenerationProviderContext<TInput, TOutput, TConfig, TSchemaOutput> {
    const ctx = super.getProviderContext(context, config, defaultConfig);
    return Object.assign(ctx, {
      existingSchemaResults: new Map<string, TSchemaOutput>(),
      output: this.initResult(ctx),
    });
  }

  protected override async onGenerate(ctx: TContext): Promise<TOutput> {
    for (const schema of ctx.data.schemas) {
      await this.getSchemaResult(ctx, schema);
    }

    await this.generateAdditionalFiles(ctx);

    return ctx.output;
  }

  public async getSchemaResult(ctx: TContext, schema: ApiSchema): Promise<TSchemaOutput> {
    const existingResult = ctx.existingSchemaResults.get(schema.id);
    if (existingResult) return existingResult;

    let result: TSchemaOutput;
    const reference = this.getSchemaReference(ctx, schema);
    if (reference) {
      result = await this.getSchemaResult(ctx, reference);
    } else {
      result = await this.generateSchema(ctx, schema);
    }

    addSourceIfTest(ctx.config, result, () => `${schema.$src.file}#${schema.$src.path}`);
    ctx.existingSchemaResults.set(schema.id, result);
    this.addSchemaResult(ctx, schema, result);
    return result;
  }

  // deno-lint-ignore no-unused-vars
  protected getSchemaReference(ctx: TContext, schema: ApiSchema): ApiSchema | undefined {
    const ref = getSchemaReference(schema, ['description']);
    return ref.id !== schema.id ? ref : undefined;
  }

  protected abstract initResult(ctx: OpenApiGenerationProviderContext<TInput, TConfig>): TOutput;

  protected abstract generateSchema(ctx: TContext, schema: ApiSchema): MaybePromise<TSchemaOutput>;

  protected abstract addSchemaResult(ctx: TContext, schema: ApiSchema, result: TSchemaOutput): void;

  // deno-lint-ignore no-unused-vars
  protected generateAdditionalFiles(ctx: TContext): MaybePromise<void> {
    // Override if needed
  }
}
