import { dirname, resolve } from 'path';

import { ensureDirSync, writeFileSync } from 'fs-extra';

import { ApiService, DefaultGenerationProviderConfig, OpenApiServicesGenerationProviderBase } from '@goast/core';

import { TypeScriptFetchClientsGeneratorConfig, defaultTypeScriptFetchClientsGeneratorConfig } from './config';
import {
  DefaultTypeScriptFetchClientGenerator,
  TypeScriptFetchClientGenerator,
  TypeScriptFetchClientGeneratorResult,
  TypeScriptFetchClientGeneratorType,
} from './fetch-client-generator';
import { ImportExportCollection } from '../../../import-collection';
import { getModulePathRelativeToFile } from '../../../utils';
import { TypeScriptModelsGeneratorResult } from '../../models/models-generator';
import { TypeScriptClientInterfacesGeneratorResult } from '../client-interfaces/client-interfaces-generator';

export type TypeScriptFetchClientsGeneratorInput = TypeScriptModelsGeneratorResult &
  Partial<TypeScriptClientInterfacesGeneratorResult>;

export type TypeScriptFetchClientsGeneratorResult = {
  clients: {
    [serviceId: string]: TypeScriptFetchClientGeneratorResult;
  };
  clientIndexFilePath: string | undefined;
};

export class TypeScriptClientsGenerator extends OpenApiServicesGenerationProviderBase<
  TypeScriptFetchClientsGeneratorInput,
  TypeScriptFetchClientsGeneratorResult,
  TypeScriptFetchClientsGeneratorConfig,
  TypeScriptFetchClientGeneratorResult
> {
  private readonly _clientGenerator: TypeScriptFetchClientGeneratorType;

  constructor(clientGenerator?: TypeScriptFetchClientGeneratorType) {
    super();
    this._clientGenerator = clientGenerator ?? DefaultTypeScriptFetchClientGenerator;
  }

  protected override getDefaultConfig(): DefaultGenerationProviderConfig<TypeScriptFetchClientsGeneratorConfig> {
    return defaultTypeScriptFetchClientsGeneratorConfig;
  }

  protected override initResult(): TypeScriptFetchClientsGeneratorResult {
    return {
      clients: {},
      clientIndexFilePath: undefined,
    };
  }

  public override generate(): TypeScriptFetchClientsGeneratorResult {
    super.generate();
    this.result.clientIndexFilePath = this.generateIndexFile();
    return this.result;
  }

  protected override generateService(service: ApiService): TypeScriptFetchClientGeneratorResult {
    const clientGenerator = this.initClientGenerator(service);
    return clientGenerator.generate();
  }

  protected override addServiceResult(service: ApiService, result: TypeScriptFetchClientGeneratorResult): void {
    this.result.clients[service.id] = result;
  }

  protected generateIndexFile(): string | undefined {
    if (!this.shouldGenerateIndexFile()) {
      return undefined;
    }

    const filePath = this.getIndexFilePath();
    console.log(`Generating index file to ${filePath}...`);
    ensureDirSync(dirname(filePath));

    writeFileSync(filePath, this.generateIndexFileContent(filePath));

    return filePath;
  }

  protected getIndexFilePath(): string {
    return resolve(this.config.outputDir, this.config.indexFilePath ?? 'clients.ts');
  }

  protected shouldGenerateIndexFile(): boolean {
    return this.config.indexFilePath !== null;
  }

  protected generateIndexFileContent(absoluteIndexFilePath: string): string {
    const exports = new ImportExportCollection();

    for (const clientId in this.result.clients) {
      const client = this.result.clients[clientId];
      if (!client.classFilePath) continue;
      exports.addExport(
        client.className,
        getModulePathRelativeToFile(absoluteIndexFilePath, client.classFilePath, this.config.importModuleTransformer)
      );
    }

    if (this.input.clientInterfaceIndexFilePath === absoluteIndexFilePath) {
      for (const clientId in this.input.clients) {
        const client = this.input.clients[clientId];
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
    }

    return exports.toString(this.config.newLine);
  }

  private initClientGenerator(service: ApiService): TypeScriptFetchClientGenerator {
    const generator = new this._clientGenerator();
    generator.init({
      config: this.config,
      data: this.data,
      service,
    });
    return generator;
  }
}
