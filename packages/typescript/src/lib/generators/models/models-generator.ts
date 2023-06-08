import { dirname, resolve } from 'path';

import { ensureDirSync, writeFileSync } from 'fs-extra';

import { ApiSchema, DefaultGenerationProviderConfig, OpenApiSchemasGenerationProviderBase } from '@goast/core';
import { Nullable } from '@goast/core/utils';

import { TypeScriptModelsGeneratorConfig, defaultTypeScriptModelsGeneratorConfig } from './config';
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
  modelIndexFilePath: Nullable<string>;
};

export class TypeScriptModelsGenerator extends OpenApiSchemasGenerationProviderBase<
  {},
  TypeScriptModelsGeneratorResult,
  TypeScriptModelsGeneratorConfig,
  TypeScriptModelGeneratorResult
> {
  private readonly _modelGenerator: TypeScriptModelGeneratorType | TypeScriptModelGenerator;

  constructor(modelGenerator?: TypeScriptModelGeneratorType | TypeScriptModelGenerator) {
    super();
    this._modelGenerator = modelGenerator ?? new DefaultTypeScriptModelGenerator();
  }

  protected override getDefaultConfig(): DefaultGenerationProviderConfig<TypeScriptModelsGeneratorConfig> {
    return defaultTypeScriptModelsGeneratorConfig;
  }

  protected override initResult(): TypeScriptModelsGeneratorResult {
    return {
      models: {},
      modelIndexFilePath: undefined,
    };
  }

  public override generate(): TypeScriptModelsGeneratorResult {
    super.generate();
    this.result.modelIndexFilePath = this.generateIndexFile();
    return this.result;
  }

  protected override generateSchema(schema: ApiSchema): TypeScriptModelGeneratorResult {
    const modelGenerator = this.initModelGenerator(schema);
    return modelGenerator.generate();
  }

  protected override addSchemaResult(schema: ApiSchema, result: TypeScriptModelGeneratorResult): void {
    this.result.models[schema.id] = result;
  }

  protected generateIndexFile(): string | undefined {
    if (!this.shouldGenerateIndexFile()) {
      return undefined;
    }

    const filePath = this.getIndexFilePath();
    console.log(`Generating index file to ${filePath}...`);
    ensureDirSync(dirname(filePath));

    writeFileSync(filePath, this.generateIndexFileContent());

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
      if (!model.typeFilePath) continue;
      exports.addExport(
        model.typeName,
        getModulePathRelativeToFile(absoluteIndexFilePath, model.typeFilePath, this.config.importModuleTransformer)
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
