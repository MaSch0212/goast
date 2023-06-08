import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

import { ensureDirSync } from 'fs-extra';

import { ApiData, ApiEndpoint, ApiService } from '@goast/core';
import { SourceBuilder, getInitializedValue, toCasing } from '@goast/core/utils';

import { TypeScriptClientInterfacesGeneratorInput } from './client-interfaces-generator';
import { TypeScriptClientInterfaceGeneratorConfig } from './config';
import { ImportExportCollection } from '../../../import-collection';
import { getModulePathRelativeToFile, toTypeScriptPropertyName } from '../../../utils';

export type TypeScriptClientInterfaceGeneratorResult = {
  interfaceName: string;
  interfaceFilePath: string;
};

export interface TypeScriptClientInterfaceGeneratorType extends Function {
  new (): TypeScriptClientInterfaceGenerator;
}

export type TypeScriptClientInterfaceGeneratorContext = {
  readonly config: TypeScriptClientInterfaceGeneratorConfig;
  readonly input: TypeScriptClientInterfacesGeneratorInput;
  readonly data: ApiData;
  readonly service: ApiService;
};

export interface TypeScriptClientInterfaceGenerator<
  TOutput extends TypeScriptClientInterfaceGeneratorResult = TypeScriptClientInterfaceGeneratorResult
> {
  init(context: TypeScriptClientInterfaceGeneratorContext): void;
  generate(): TOutput;
}

export class DefaultTypeScriptClientInterfaceGenerator implements TypeScriptClientInterfaceGenerator {
  private _context?: TypeScriptClientInterfaceGeneratorContext | undefined;
  private _builder?: SourceBuilder;

  protected filePath?: string;
  protected imports = new ImportExportCollection();

  protected get context(): TypeScriptClientInterfaceGeneratorContext {
    return getInitializedValue(this._context);
  }

  protected get builder(): SourceBuilder {
    return getInitializedValue(this._builder);
  }

  public init(context: TypeScriptClientInterfaceGeneratorContext): void {
    this._context = context;
    this._builder = new SourceBuilder(context.config);

    this.filePath = undefined;
    this.imports.clear();
  }

  public generate(): TypeScriptClientInterfaceGeneratorResult {
    const interfaceName = this.getInterfaceName();
    const interfaceFilePath = this.getInterfaceFilePath();
    console.log(`Generating interface ${interfaceName} in ${interfaceFilePath}...`);
    ensureDirSync(dirname(interfaceFilePath));

    this.filePath = interfaceFilePath;
    this.generateFileContent();

    writeFileSync(interfaceFilePath, this.builder.toString());

    return { interfaceName, interfaceFilePath };
  }

  protected generateFileContent() {
    this.builder
      .apply(() => this.generateInterfaceDocumentation())
      .ensureCurrentLineEmpty()
      .apply(() => this.generateInterfaceSignature())
      .append(' ')
      .parenthesize('{}', () => this.generateInterfaceContent())
      .prependLineIf(this.imports.hasImports, (builder) => this.imports.writeTo(builder))
      .ensureCurrentLineEmpty();
  }

  protected generateInterfaceDocumentation() {
    if (this.context.service.description) {
      this.builder.appendLine('/**').appendLineWithLinePrefix(' *', this.context.service.description).appendLine(' */');
    }
  }

  protected generateInterfaceSignature() {
    this.builder.append('export interface ').append(this.getInterfaceName());
  }

  protected generateInterfaceContent() {
    this.builder.forEach(this.context.service.endpoints, (builder, endpoint) =>
      builder
        .ensurePreviousLineEmpty()
        .apply(() => this.generateServiceMethodDocumentation(endpoint))
        .ensureCurrentLineEmpty()
        .apply(() => this.generateServiceMethodSignature(endpoint))
        .appendLine(';')
    );
  }

  protected generateServiceMethodDocumentation(endpoint: ApiEndpoint) {
    const hasParams =
      endpoint.parameters.some((p) => p.target === 'path' || p.target === 'query') ||
      (!!endpoint.requestBody && endpoint.requestBody?.content.length > 0);
    this.builder
      .appendLine('/**')
      .applyWithLinePrefix(' * ', (builder) =>
        builder
          .appendLine(endpoint.description ?? '[No description was provided by the API]')
          .appendLine(`@see ${this.getFullEndpointUrl(endpoint)}`)
          .appendLineIf(hasParams, `@param params Parameters for the endpoint.`)
          .appendLine(`@returns The response of the call to the endpoint.`)
      )
      .appendLine(' */');
  }

  protected generateServiceMethodSignature(endpoint: ApiEndpoint) {
    this.builder
      .append(toCasing(endpoint.name, this.context.config.publicFunctionCasing))
      .parenthesize('()', (builder) =>
        builder.append('params: ').apply(() => this.generateServiceMethodParametersType(endpoint))
      )
      .append(' : Response');
  }

  protected generateServiceMethodParametersType(endpoint: ApiEndpoint) {
    this.builder.parenthesize('{}', (builder) =>
      builder
        .forEach(endpoint.parameters, (builder, parameter) =>
          builder.appendLine(`${this.toPropertyName(parameter.name)}: ${this.getTypeName(parameter.schema?.id)};`)
        )
        .if(!!endpoint.requestBody && endpoint.requestBody.content.length > 0, (builder) =>
          builder.appendLine(`body: ${this.getTypeName(endpoint.requestBody?.content[0].schema?.id)};`)
        )
    );
  }

  protected getInterfaceName(): string {
    return toCasing(this.context.service.name, this.context.config.interfaceNameCasing);
  }

  protected getInterfaceFilePath(): string {
    return resolve(
      this.context.config.outputDir,
      this.context.config.interfaceDirPath,
      `${toCasing(this.context.service.name, this.context.config.fileNameCasing)}.ts`
    );
  }

  protected getAnyType(): string {
    return this.context.config.preferUnknown ? 'unknown' : 'any';
  }

  protected getTypeName(schemaId: string | undefined): string {
    if (!schemaId) {
      return this.getAnyType();
    }

    const modelInfo = this.context.input.models[schemaId];
    if (modelInfo?.typeFilePath && this.filePath) {
      this.imports.addImport(
        modelInfo.typeName,
        getModulePathRelativeToFile(this.filePath, modelInfo.typeFilePath, this.context.config.importModuleTransformer)
      );
    }

    return modelInfo?.typeName ?? this.getAnyType();
  }

  protected getFullEndpointUrl(endpoint: ApiEndpoint): string {
    let url = endpoint.path;
    const queryParams = endpoint.parameters.filter((p) => p.target === 'query');
    if (queryParams.length > 0) {
      url += '?' + queryParams.map((p) => (p.required ? `${p.name}={${p.name}}` : `[${p.name}={${p.name}}]`)).join('&');
    }
    return url;
  }

  private toPropertyName(name: string): string {
    return toTypeScriptPropertyName(name, this.context.config.useSingleQuotes);
  }
}
