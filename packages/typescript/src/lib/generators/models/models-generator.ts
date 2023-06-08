import { dirname, resolve } from 'path';

import fs from 'fs-extra';

import {
  ApiSchema,
  ApiData,
  OpenApiGenerationProvider,
  OpenApiGeneratorConfig,
  OpenApiGeneratorContext,
} from '@goast/core';
import { getInitializedValue, getSchemaReference } from '@goast/core/utils';

import {
  TypeScriptModelsGeneratorConfig,
  TypeScriptModelsGeneratorConfigOverrides,
  defaultTypeScriptModelsGeneratorConfig,
} from './config';
import {
  DefaultTypeScriptModelGenerator,
  TypeScriptModelGenerator,
  TypeScriptModelGeneratorResult,
  TypeScriptModelGeneratorType,
} from './model-generator';
import { ImportExportCollection } from '../../import-collection';
import { getModulePathRelativeToFile } from '../../utils';

export type TypeScriptModelsGeneratorResult = {
  models: {
    [schemaId: string]: TypeScriptModelGeneratorResult;
  };
  modelIndexFilePath: string | undefined;
};

export class TypeScriptModelsGenerator
  implements OpenApiGenerationProvider<{}, TypeScriptModelsGeneratorResult, TypeScriptModelsGeneratorConfig>
{
  private readonly _modelGenerator: TypeScriptModelGeneratorType | TypeScriptModelGenerator;
  private _config?: OpenApiGeneratorConfig & TypeScriptModelsGeneratorConfig;
  private _data?: ApiData;

  constructor(modelGenerator?: TypeScriptModelGeneratorType | TypeScriptModelGenerator) {
    this._modelGenerator = modelGenerator ?? new DefaultTypeScriptModelGenerator();
  }

  public get config(): OpenApiGeneratorConfig & TypeScriptModelsGeneratorConfig {
    return getInitializedValue(this._config);
  }

  public get data(): ApiData {
    return getInitializedValue(this._data);
  }

  protected result: TypeScriptModelsGeneratorResult = { models: {}, modelIndexFilePath: undefined };

  public init(context: OpenApiGeneratorContext<{}>, config?: TypeScriptModelsGeneratorConfigOverrides): void {
    this._config = { ...defaultTypeScriptModelsGeneratorConfig, ...context.config, ...config };
    this._data = context.data;
    this.result = { models: {}, modelIndexFilePath: undefined };
  }

  public async generate(): Promise<TypeScriptModelsGeneratorResult> {
    for (const schema of this.data.schemas) {
      await this.getSchemaResult(schema);
    }

    this.result.modelIndexFilePath = await this.generateIndexFile();

    return this.result;
  }

  public getSchemaResult(schema: ApiSchema): TypeScriptModelGeneratorResult {
    const existingResult = this.result.models[schema.id];
    if (existingResult) return existingResult;

    let result: TypeScriptModelGeneratorResult;
    const reference = this.getSchemaReference(schema);
    if (reference) {
      result = this.getSchemaResult(reference);
    } else {
      const modelGenerator = this.initModelGenerator(schema);
      result = modelGenerator.generate();
    }

    if ((this.config as any)['__test__']) {
      result = {
        ...result,
        __source__: `${schema.$src.file}#${schema.$src.path}`,
      } as any;
    }
    this.result.models[schema.id] = result;
    return result;
  }

  protected getSchemaReference(schema: ApiSchema): ApiSchema | undefined {
    const ref = getSchemaReference(schema, ['description']);
    return ref.id !== schema.id ? ref : undefined;
  }

  protected generateIndexFile(): string | undefined {
    if (!this.shouldGenerateIndexFile()) {
      return undefined;
    }

    const filePath = this.getIndexFilePath();
    console.log(`Generating index file to ${filePath}...`);
    fs.ensureDirSync(dirname(filePath));

    fs.writeFileSync(filePath, this.generateIndexFileContent());

    return filePath;
  }

  protected getIndexFilePath(): string {
    return resolve(this.config.outputDir, this.config.indexFilePath ?? 'models.ts');
  }

  protected shouldGenerateIndexFile(): boolean {
    return this.config.indexFilePath !== null;
  }

  protected generateIndexFileContent(): string {
    const exports = new ImportExportCollection();
    const absoluteIndexFilePath = this.getIndexFilePath();

    for (const modelId in this.result.models) {
      const model = this.result.models[modelId];
      if (!model.filePath) continue;
      exports.addExport(
        model.typeName,
        getModulePathRelativeToFile(absoluteIndexFilePath, model.filePath, this.config.importModuleTransformer)
      );
    }

    return exports.toString(this.config.newLine);
  }

  private initModelGenerator(schema: ApiSchema): TypeScriptModelGenerator {
    const generator = typeof this._modelGenerator === 'function' ? new this._modelGenerator() : this._modelGenerator;
    generator.init({
      config: this.config,
      data: this.data,
      schema,
      getSchemaResult: (schema: ApiSchema) => this.getSchemaResult(schema),
    });
    return generator;
  }
}
