import { dirname, resolve } from 'path';

import { ensureDirSync, writeFileSync } from 'fs-extra';

import { ApiService, DefaultGenerationProviderConfig, OpenApiServicesGenerationProviderBase } from '@goast/core';

import {
  DefaultTypeScriptClientInterfaceGenerator,
  TypeScriptClientInterfaceGenerator,
  TypeScriptClientInterfaceGeneratorResult,
  TypeScriptClientInterfaceGeneratorType,
} from './client-interface-generator';
import { TypeScriptClientInterfacesGeneratorConfig, defaultTypeScriptClientInterfacesGeneratorConfig } from './config';
import { ImportExportCollection } from '../../../import-collection';
import { getModulePathRelativeToFile } from '../../../utils';
import { TypeScriptModelsGeneratorResult } from '../../models/models-generator';

export type TypeScriptClientInterfacesGeneratorInput = TypeScriptModelsGeneratorResult;

export type TypeScriptClientInterfacesGeneratorResult = {
  clients: {
    [serviceId: string]: TypeScriptClientInterfaceGeneratorResult;
  };
  clientInterfaceIndexFilePath: string | undefined;
};

export class TypeScriptClientInterfacesGenerator extends OpenApiServicesGenerationProviderBase<
  TypeScriptClientInterfacesGeneratorInput,
  TypeScriptClientInterfacesGeneratorResult,
  TypeScriptClientInterfacesGeneratorConfig,
  TypeScriptClientInterfaceGeneratorResult
> {
  private readonly _clientGenerator: TypeScriptClientInterfaceGeneratorType | TypeScriptClientInterfaceGenerator;

  constructor(clientGenerator?: TypeScriptClientInterfaceGeneratorType | TypeScriptClientInterfaceGenerator) {
    super();
    this._clientGenerator = clientGenerator ?? new DefaultTypeScriptClientInterfaceGenerator();
  }

  protected override getDefaultConfig(): DefaultGenerationProviderConfig<TypeScriptClientInterfacesGeneratorConfig> {
    return defaultTypeScriptClientInterfacesGeneratorConfig;
  }

  protected override initResult(): TypeScriptClientInterfacesGeneratorResult {
    return {
      clients: {},
      clientInterfaceIndexFilePath: undefined,
    };
  }

  public override generate(): TypeScriptClientInterfacesGeneratorResult {
    super.generate();
    this.result.clientInterfaceIndexFilePath = this.generateIndexFile();
    return this.result;
  }

  protected override generateService(service: ApiService): TypeScriptClientInterfaceGeneratorResult {
    const clientGenerator = this.initClientGenerator(service);
    return clientGenerator.generate();
  }

  protected override addServiceResult(service: ApiService, result: TypeScriptClientInterfaceGeneratorResult): void {
    this.result.clients[service.id] = result;
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
    return resolve(this.config.outputDir, this.config.indexFilePath ?? 'clients.ts');
  }

  protected shouldGenerateIndexFile(): boolean {
    return this.config.indexFilePath !== null;
  }

  protected generateIndexFileContent(): string {
    const exports = new ImportExportCollection();
    const absoluteIndexFilePath = this.getIndexFilePath();

    for (const clientId in this.result.clients) {
      const client = this.result.clients[clientId];
      if (!client.interfaceFilePath) continue;
      exports.addExport(
        client.interfaceName,
        getModulePathRelativeToFile(
          absoluteIndexFilePath,
          client.interfaceFilePath,
          this.config.importModuleTransformer
        )
      );
    }

    return exports.toString(this.config.newLine);
  }

  private initClientGenerator(service: ApiService): TypeScriptClientInterfaceGenerator {
    const generator = typeof this._clientGenerator === 'function' ? new this._clientGenerator() : this._clientGenerator;
    generator.init({
      config: this.config,
      input: this.input,
      data: this.data,
      service,
    });
    return generator;
  }
}
