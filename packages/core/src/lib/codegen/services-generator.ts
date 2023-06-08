import { OpenApiGenerationProviderBase } from './generator';
import { addSourceIfTest } from './internal-utils';
import { OpenApiGeneratorInput, OpenApiGeneratorOutput, AnyConfig, OpenApiGeneratorContext } from './types';
import { ApiService } from '../transform';
import { getInitializedValue } from '../utils';

export abstract class OpenApiServicesGenerationProviderBase<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TServiceOutput extends OpenApiGeneratorOutput
> extends OpenApiGenerationProviderBase<TInput, TOutput, TConfig> {
  private _result: TOutput | undefined;

  protected readonly existingServiceResults = new Map<string, TServiceOutput>();

  protected get result(): TOutput {
    return getInitializedValue(this._result);
  }

  public override init(context: OpenApiGeneratorContext<TInput>, config?: Partial<TConfig> | undefined): void {
    super.init(context, config);
    this._result = this.initResult();
  }

  public override generate(): TOutput {
    for (const service of this.data.services) {
      this.getServiceResult(service);
    }

    return this.result;
  }

  public getServiceResult(service: ApiService): TServiceOutput {
    const existingResult = this.existingServiceResults.get(service.id);
    if (existingResult) return existingResult;

    const result = this.generateService(service);

    addSourceIfTest(this.config, result, () =>
      service.$src ? `${service.$src.file}#${service.$src.path}` : `tag:${service.name}`
    );
    this.addServiceResult(service, result);
    return result;
  }

  protected abstract initResult(): TOutput;

  protected abstract generateService(service: ApiService): TServiceOutput;

  protected abstract addServiceResult(service: ApiService, result: TServiceOutput): void;
}
