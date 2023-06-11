import { resolve } from 'path';

import { ApiEndpoint } from '@goast/core';
import { getEndpointUrlPreview, toCasing } from '@goast/core/utils';

import { TypeScriptFetchClientGeneratorContext, TypeScriptFetchClientGeneratorOutput } from './models';
import { TypeScriptFileBuilder } from '../../../file-builder';
import { TypeScriptFileGenerator } from '../../file-generator';

type Context = TypeScriptFetchClientGeneratorContext;
type Output = TypeScriptFetchClientGeneratorOutput;
type Builder = TypeScriptFileBuilder;

export interface TypeScriptFetchClientGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): TOutput;
}

export class DefaultTypeScriptFetchClientGenerator
  extends TypeScriptFileGenerator<Context, Output>
  implements TypeScriptFetchClientGenerator
{
  public generate(ctx: Context): Output {
    const result: Output = {};
    let builder: Builder | undefined;

    if (this.shouldGenerateInterface(ctx)) {
      const filePath = this.getInterfaceFilePath(ctx);
      const name = this.getInterfaceName(ctx);
      console.log(`Generating interface ${name} in ${filePath}...`);

      builder = new TypeScriptFileBuilder(filePath, ctx.config);
      this.generateInterface(ctx, builder);

      result.interface = { filePath, name };
    }

    if (this.shouldGenerateClass(ctx)) {
      const filePath = this.getClassFilePath(ctx);
      const name = this.getClassName(ctx);
      console.log(`Generating class ${name} in ${filePath}...`);

      if (!builder || builder.filePath !== filePath) {
        builder = new TypeScriptFileBuilder(filePath, ctx.config);
      }
      this.generateClass(ctx, builder);

      result.class = { filePath, name };
    }

    return result;
  }

  protected generateInterface(ctx: Context, builder: Builder) {
    builder
      .ensurePreviousLineEmpty()
      .apply((builder) => this.generateInterfaceDocumentation(ctx, builder))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateInterfaceSignature(ctx, builder))
      .append(' ')
      .parenthesize('{}', (builder) => this.generateInterfaceContent(ctx, builder))
      .appendLine();
  }

  protected generateInterfaceDocumentation(ctx: Context, builder: Builder) {
    if (ctx.service.description) {
      builder.appendLine('/**').appendLineWithLinePrefix(' *', ctx.service.description).appendLine(' */');
    }
  }

  protected generateInterfaceSignature(ctx: Context, builder: Builder) {
    builder.append('export interface ').append(this.getInterfaceName(ctx));
  }

  protected generateInterfaceContent(ctx: Context, builder: Builder) {
    builder.forEach(ctx.service.endpoints, (builder, endpoint) =>
      this.generateInterfaceServiceMethod(ctx, builder, endpoint)
    );
  }

  protected generateInterfaceServiceMethod(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    builder
      .ensurePreviousLineEmpty()
      .apply((builder) => this.generateServiceMethodDocumentation(ctx, builder, endpoint))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateServiceMethodSignature(ctx, builder, endpoint))
      .appendLine(';');
  }

  protected generateClass(ctx: Context, builder: Builder) {
    builder
      .ensurePreviousLineEmpty()
      .apply((builder) => this.generateClassDocumentation(ctx, builder))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateClassSignature(ctx, builder))
      .append(' ')
      .parenthesize('{}', (builder) => this.generateClassContent(ctx, builder))
      .appendLine();
  }

  protected generateClassDocumentation(ctx: Context, builder: Builder) {
    if (ctx.service.description) {
      builder.appendLine('/**').appendLineWithLinePrefix(' *', ctx.service.description).appendLine(' */');
    }
  }

  protected generateClassSignature(ctx: Context, builder: Builder) {
    builder.append('export class ').append(this.getClassName(ctx));
  }

  protected generateClassContent(ctx: Context, builder: Builder) {
    builder.forEach(ctx.service.endpoints, (builder, endpoint) =>
      this.generateClassServiceMethod(ctx, builder, endpoint)
    );
  }

  protected generateClassServiceMethod(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    builder
      .ensurePreviousLineEmpty()
      .apply((builder) => this.generateServiceMethodDocumentation(ctx, builder, endpoint))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateServiceMethodSignature(ctx, builder, endpoint))
      .append(' ')
      .parenthesize('{}', (builder) => this.generateServiceMethodContent(ctx, builder, endpoint))
      .appendLine();
  }

  protected generateServiceMethodDocumentation(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    const hasParams =
      endpoint.parameters.some((p) => p.target === 'path' || p.target === 'query') ||
      (!!endpoint.requestBody && endpoint.requestBody?.content.length > 0);
    builder
      .appendLine('/**')
      .applyWithLinePrefix(' * ', (builder) =>
        builder
          .appendLine(endpoint.description ?? '[No description was provided by the API]')
          .appendLine(`@see ${getEndpointUrlPreview(endpoint)}`)
          .appendLineIf(hasParams, `@param params Parameters for the endpoint.`)
          .appendLine(`@returns The response of the call to the endpoint.`)
      )
      .appendLine(' */');
  }

  protected generateServiceMethodSignature(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    builder
      .append(toCasing(endpoint.name, ctx.config.methodCasing))
      .parenthesize('()', (builder) => this.generateServiceMethodParameters(ctx, builder, endpoint))
      .append(' : ')
      .apply((builder) => this.generateServiceMethodReturnValue(ctx, builder, endpoint));
  }

  protected generateServiceMethodParameters(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    builder
      .append('params: ')
      .parenthesize('{}', (builder) =>
        builder
          .forEach(endpoint.parameters, (builder, parameter) =>
            builder.appendLine(
              `${this.toPropertyName(ctx, parameter.name)}: ${this.getTypeName(ctx, builder, parameter.schema?.id)};`
            )
          )
          .applyIf(!!endpoint.requestBody && endpoint.requestBody.content.length > 0, (builder) =>
            builder.appendLine(`body: ${this.getTypeName(ctx, builder, endpoint.requestBody?.content[0].schema?.id)};`)
          )
      );
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  protected generateServiceMethodReturnValue(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    builder.append('Response');
  }

  protected generateServiceMethodContent(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    // TODO: Implement
    builder.appendLine('return undefined as unknown as Response;');
  }

  protected getTypeName(ctx: Context, builder: Builder, schemaId: string | undefined): string {
    if (!schemaId) {
      return this.getAnyType(ctx);
    }

    const modelInfo = ctx.input.models[schemaId];
    if (!modelInfo) {
      return this.getAnyType(ctx);
    }

    if (modelInfo.filePath) {
      builder.addImport(modelInfo.name, modelInfo.filePath);
    }

    return modelInfo.name;
  }

  protected shouldGenerateInterface(ctx: Context): boolean {
    return ctx.config.clientFileKind === 'interface' || ctx.config.clientFileKind === 'class-and-interface';
  }

  protected shouldGenerateClass(ctx: Context): boolean {
    return ctx.config.clientFileKind === 'class' || ctx.config.clientFileKind === 'class-and-interface';
  }

  protected getInterfaceName(ctx: Context): string {
    return toCasing(ctx.service.name, ctx.config.interfaceNameCasing);
  }

  protected getClassName(ctx: Context): string {
    return toCasing(ctx.service.name, ctx.config.classNameCasing);
  }

  protected getInterfaceFilePath(ctx: Context): string {
    return resolve(
      ctx.config.outputDir,
      ctx.config.clientInterfaceDirPath ?? ctx.config.clientDirPath,
      `${toCasing(ctx.service.name, ctx.config.interfaceFileNameCasing ?? ctx.config.fileNameCasing)}.ts`
    );
  }

  protected getClassFilePath(ctx: Context): string {
    return resolve(
      ctx.config.outputDir,
      ctx.config.clientDirPath,
      `${toCasing(ctx.service.name, ctx.config.fileNameCasing)}.ts`
    );
  }
}
