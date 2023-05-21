import { dirname, resolve } from 'path';

import fs from 'fs-extra';

import {
  ApiSchema,
  OpenApiData,
  OpenApiGenerationProvider,
  OpenApiGeneratorConfig,
  OpenApiGeneratorContext,
} from '@goast/core';
import { getInitializedValue } from '@goast/core/utils';

import {
  TypeScriptModelsGeneratorConfig,
  TypeScriptModelsGeneratorConfigOverrides,
  defaultTypeScriptModelsGeneratorConfig,
} from './config.js';
import {
  DefaultTypeScriptModelGenerator,
  TypeScriptModelGenerator,
  TypeScriptModelGeneratorResult,
  TypeScriptModelGeneratorType,
} from './model-generator.js';
import { ImportExportCollection } from '../import-collection.js';
import { getModulePathRelativeToFile } from '../utils.js';

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
  private _data?: OpenApiData;

  constructor(modelGenerator?: TypeScriptModelGeneratorType | TypeScriptModelGenerator) {
    this._modelGenerator = modelGenerator ?? new DefaultTypeScriptModelGenerator();
  }

  protected get config(): OpenApiGeneratorConfig & TypeScriptModelsGeneratorConfig {
    return getInitializedValue(this._config);
  }

  protected get data(): OpenApiData {
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
      const modelGenerator = await this.initModelGenerator(schema);
      const result = await modelGenerator.generate();
      this.result.models[schema.id] = result;
    }

    this.result.modelIndexFilePath = await this.generateIndexFile();

    return this.result;
  }

  private async initModelGenerator(schema: ApiSchema): Promise<TypeScriptModelGenerator> {
    const generator = typeof this._modelGenerator === 'function' ? new this._modelGenerator() : this._modelGenerator;
    await generator.init(this.config, this.data, schema);
    return generator;
  }

  protected async generateIndexFile(): Promise<string | undefined> {
    if (!this.shouldGenerateIndexFile()) {
      return undefined;
    }

    const filePath = this.getIndexFilePath();
    console.log(`Generating index file to ${filePath}...`);
    await fs.ensureDir(dirname(filePath));

    await fs.writeFile(filePath, this.generateIndexFileContent());

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
}
