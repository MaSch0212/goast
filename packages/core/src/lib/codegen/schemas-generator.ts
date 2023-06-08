import { OpenApiGenerationProviderBase } from './generator';
import { addSourceIfTest } from './internal-utils';
import { AnyConfig, OpenApiGeneratorContext, OpenApiGeneratorInput, OpenApiGeneratorOutput } from './types';
import { ApiSchema } from '../transform';
import { getInitializedValue, getSchemaReference } from '../utils';

export abstract class OpenApiSchemasGenerationProviderBase<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TSchemaOutput extends OpenApiGeneratorOutput
> extends OpenApiGenerationProviderBase<TInput, TOutput, TConfig> {
  private _result: TOutput | undefined;

  protected readonly existingSchemaResults = new Map<string, TSchemaOutput>();

  protected get result(): TOutput {
    return getInitializedValue(this._result);
  }

  public override init(context: OpenApiGeneratorContext<TInput>, config?: Partial<TConfig> | undefined): void {
    super.init(context, config);
    this._result = this.initResult();
  }

  public override generate(): TOutput {
    for (const schema of this.data.schemas) {
      this.getSchemaResult(schema);
    }

    return this.result;
  }

  public getSchemaResult(schema: ApiSchema): TSchemaOutput {
    const existingResult = this.existingSchemaResults.get(schema.id);
    if (existingResult) return existingResult;

    let result: TSchemaOutput;
    const reference = this.getSchemaReference(schema);
    if (reference) {
      result = this.getSchemaResult(reference);
    } else {
      result = this.generateSchema(schema);
    }

    addSourceIfTest(this.config, result, () => `${schema.$src.file}#${schema.$src.path}`);
    this.addSchemaResult(schema, result);
    return result;
  }

  protected getSchemaReference(schema: ApiSchema): ApiSchema | undefined {
    const ref = getSchemaReference(schema, ['description']);
    return ref.id !== schema.id ? ref : undefined;
  }

  protected abstract initResult(): TOutput;

  protected abstract generateSchema(schema: ApiSchema): TSchemaOutput;

  protected abstract addSchemaResult(schema: ApiSchema, result: TSchemaOutput): void;
}
