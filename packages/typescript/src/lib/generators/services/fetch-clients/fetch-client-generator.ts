import { ApiData, ApiService } from '@goast/core';
import { SourceBuilder, getInitializedValue } from '@goast/core/utils';

import { TypeScriptFetchClientGeneratorConfig } from './config';
import { ImportExportCollection } from '../../../import-collection';

export type TypeScriptFetchClientGeneratorResult = {
  className: string;
  classFilePath: string;
};

export interface TypeScriptFetchClientGeneratorType extends Function {
  new (): TypeScriptFetchClientGenerator;
}

export type TypeScriptFetchClientGeneratorContext = {
  readonly config: TypeScriptFetchClientGeneratorConfig;
  readonly data: ApiData;
  readonly service: ApiService;
};

export interface TypeScriptFetchClientGenerator<
  TOutput extends TypeScriptFetchClientGeneratorResult = TypeScriptFetchClientGeneratorResult
> {
  init(context: TypeScriptFetchClientGeneratorContext): void;
  generate(): TOutput;
}

export class DefaultTypeScriptFetchClientGenerator implements TypeScriptFetchClientGenerator {
  private _context?: TypeScriptFetchClientGeneratorContext | undefined;
  private _builder?: SourceBuilder;

  protected filePath?: string;
  protected imports = new ImportExportCollection();

  protected get context(): TypeScriptFetchClientGeneratorContext {
    return getInitializedValue(this._context);
  }

  protected get builder(): SourceBuilder {
    return getInitializedValue(this._builder);
  }

  public init(context: TypeScriptFetchClientGeneratorContext): void {
    this._context = context;
    this._builder = new SourceBuilder(context.config);

    this.filePath = undefined;
    this.imports.clear();
  }

  public generate(): TypeScriptFetchClientGeneratorResult {
    throw new Error('Method not implemented.');
  }
}
