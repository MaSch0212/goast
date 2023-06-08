import { OpenApiGenerationProviderBase } from './generator';
import { addSourceIfTest } from './internal-utils';
import { OpenApiGeneratorInput, OpenApiGeneratorOutput, AnyConfig, OpenApiGeneratorContext } from './types';
import { ApiEndpoint } from '../transform';
import { getInitializedValue } from '../utils';

export abstract class OpenApiEndpointsGenerationProviderBase<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TEndpointOutput extends OpenApiGeneratorOutput
> extends OpenApiGenerationProviderBase<TInput, TOutput, TConfig> {
  private _result: TOutput | undefined;

  protected readonly existingEndpointResults = new Map<string, TEndpointOutput>();

  protected get result(): TOutput {
    return getInitializedValue(this._result);
  }

  public override init(context: OpenApiGeneratorContext<TInput>, config?: Partial<TConfig> | undefined): void {
    super.init(context, config);
    this._result = this.initResult();
  }

  public override generate(): TOutput {
    for (const endpoint of this.data.endpoints) {
      this.getEndpointResult(endpoint);
    }

    return this.result;
  }

  public getEndpointResult(endpoint: ApiEndpoint): TEndpointOutput {
    const existingResult = this.existingEndpointResults.get(endpoint.id);
    if (existingResult) return existingResult;

    const result = this.generateEndpoint(endpoint);

    addSourceIfTest(this.config, result, () => `${endpoint.$src.file}#${endpoint.$src.path}`);
    this.addEndpointResult(endpoint, result);
    return result;
  }

  protected abstract initResult(): TOutput;

  protected abstract generateEndpoint(endpoint: ApiEndpoint): TEndpointOutput;

  protected abstract addEndpointResult(endpoint: ApiEndpoint, result: TEndpointOutput): void;
}
