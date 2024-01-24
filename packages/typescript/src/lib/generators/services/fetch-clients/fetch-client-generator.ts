import { dirname, resolve } from 'path';

import { ensureDirSync, writeFileSync } from 'fs-extra';

import { ApiEndpoint, ApiSchema, getEndpointUrlPreview, notNullish, toCasing } from '@goast/core';

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

      ensureDirSync(dirname(filePath));

      builder = new TypeScriptFileBuilder(filePath, ctx.config);
      this.generateInterface(ctx, builder);
      writeFileSync(filePath, builder.toString());

      result.interface = { filePath, component: name, imports: [{ kind: 'file', name, modulePath: filePath }] };
    }

    if (this.shouldGenerateClass(ctx)) {
      const filePath = this.getClassFilePath(ctx);
      const name = this.getClassName(ctx);
      console.log(`Generating class ${name} in ${filePath}...`);

      ensureDirSync(dirname(filePath));

      if (!builder || builder.filePath !== filePath) {
        builder = new TypeScriptFileBuilder(filePath, ctx.config);
      }
      this.generateDefaultOptions(ctx, builder);
      this.generateClass(ctx, builder);
      writeFileSync(filePath, builder.toString());

      result.class = { filePath, component: name, imports: [{ kind: 'file', name, modulePath: filePath }] };
    }

    return result;
  }

  protected generateInterface(ctx: Context, builder: Builder) {
    builder
      .ensurePreviousLineEmpty()
      .append((builder) => this.generateInterfaceDocumentation(ctx, builder))
      .ensureCurrentLineEmpty()
      .append((builder) => this.generateInterfaceSignature(ctx, builder))
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
      .append((builder) => this.generateServiceMethodDocumentation(ctx, builder, endpoint))
      .ensureCurrentLineEmpty()
      .append((builder) => this.generateServiceMethodSignature(ctx, builder, endpoint))
      .appendLine(';');
  }

  protected generateDefaultOptions(ctx: Context, builder: Builder) {
    const baseUrl = ctx.service.endpoints
      .map((x) => x.$src?.document.servers?.find((x) => x.url)?.url)
      .find((x) => !!x);
    builder
      .ensurePreviousLineEmpty()
      .addImport('FetchClientOptions', this.getUtilPath(ctx, 'types.ts'))
      .append('export const ', this.getDefaultOptionsConstantName(ctx), ': FetchClientOptions = ')
      .parenthesize(
        '{}',
        (builder) =>
          builder.appendLineIf(notNullish(baseUrl), 'baseUrl: ', this.toStringLiteral(ctx, baseUrl ?? ''), ','),
        { indent: true, multiline: true }
      );
  }

  protected generateClass(ctx: Context, builder: Builder) {
    builder
      .ensurePreviousLineEmpty()
      .append((builder) => this.generateClassDocumentation(ctx, builder))
      .ensureCurrentLineEmpty()
      .append((builder) => this.generateClassSignature(ctx, builder))
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
    builder
      .append('export class ')
      .append(this.getClassName(ctx))
      .appendIf(this.shouldGenerateInterface(ctx), (builder) =>
        builder
          .addImport(this.getInterfaceName(ctx), this.getInterfaceFilePath(ctx))
          .append(' implements ', this.getInterfaceName(ctx))
      );
  }

  protected generateClassContent(ctx: Context, builder: Builder) {
    builder
      .append((builder) => this.generateClassFields(ctx, builder))
      .append((builder) => this.generateClassConstructor(ctx, builder))
      .forEach(ctx.service.endpoints, (builder, endpoint) => this.generateClassServiceMethod(ctx, builder, endpoint));
  }

  protected generateClassFields(ctx: Context, builder: Builder) {
    builder.ensureCurrentLineEmpty().appendLine('private readonly _options: FetchClientOptions;');
  }

  protected generateClassConstructor(ctx: Context, builder: Builder) {
    builder
      .ensurePreviousLineEmpty()
      .append('constructor(options?: FetchClientOptions)')
      .parenthesize('{}', (builder) => this.generateClassConstructorContent(ctx, builder), {
        indent: true,
        multiline: true,
      });
  }

  protected generateClassConstructorContent(ctx: Context, builder: Builder) {
    builder.appendLine('this._options = { ...', this.getDefaultOptionsConstantName(ctx), ', ...options };');
  }

  protected generateClassServiceMethod(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    builder
      .ensurePreviousLineEmpty()
      .append((builder) => this.generateServiceMethodDocumentation(ctx, builder, endpoint))
      .ensureCurrentLineEmpty()
      .append((builder) => this.generateServiceMethodSignature(ctx, builder, endpoint))
      .append(' ')
      .parenthesize('{}', (builder) => this.generateServiceMethodContent(ctx, builder, endpoint), {
        indent: true,
        multiline: true,
      })
      .appendLine();
  }

  protected generateServiceMethodDocumentation(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    const hasParams =
      endpoint.parameters.some((p) => p.target === 'path' || p.target === 'query') ||
      (!!endpoint.requestBody && endpoint.requestBody?.content.length > 0);
    builder.appendComment('/***/', (builder) =>
      builder
        .appendLine(endpoint.description ?? '[No description was provided by the API]')
        .appendLine(`@see ${getEndpointUrlPreview(endpoint)}`)
        .appendLineIf(hasParams, `@param params Parameters for the endpoint.`)
        .append(`@returns The response of the call to the endpoint.`)
    );
  }

  protected generateServiceMethodSignature(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    builder
      .append(toCasing(endpoint.name, ctx.config.methodCasing))
      .parenthesize('()', (builder) => this.generateServiceMethodParameters(ctx, builder, endpoint))
      .append(': ')
      .append((builder) => this.generateServiceMethodReturnValue(ctx, builder, endpoint));
  }

  protected generateServiceMethodParameters(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    const params = endpoint.parameters.filter((x) => x.target === 'path' || x.target === 'query');
    const bodySchemaId = endpoint.requestBody?.content[0]?.schema?.id;
    builder
      .appendLineIf(params.length > 0 && !!bodySchemaId)
      .if(params.length > 0, (builder) =>
        builder
          .append('params: ')
          .parenthesize(
            '{}',
            (builder) =>
              builder.forEach(params, (builder, parameter) =>
                builder.appendLine(
                  `${this.toPropertyName(ctx, parameter.name)}: ${this.getTypeName(
                    ctx,
                    builder,
                    parameter.schema?.id
                  )};`
                )
              ),
            { indent: true, multiline: true }
          )
      )
      .appendLineIf(params.length > 0 && !!bodySchemaId, ',')
      .appendIf(!!bodySchemaId, (builder) => builder.append(`body: ${this.getTypeName(ctx, builder, bodySchemaId)}`))
      .appendLineIf(params.length > 0 && !!bodySchemaId);
  }

  protected generateServiceMethodReturnValue(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    const successResponse =
      endpoint.responses.find((x) => x.statusCode === 200) ??
      endpoint.responses.find((x) => x.statusCode && x.statusCode > 200 && x.statusCode < 300);
    const schema = successResponse?.contentOptions?.find((x) => x.schema !== undefined)?.schema;

    builder.append('Promise').parenthesize('<>', (builder) => this.generateTypedResponse(ctx, builder, schema));
  }

  protected generateTypedResponse(ctx: Context, builder: Builder, schema: ApiSchema | undefined) {
    builder
      .addImport('TypedResponse', this.getUtilPath(ctx, 'types.ts'))
      .append('TypedResponse')
      .parenthesize('<>', (builder) => builder.append(this.getTypeName(ctx, builder, schema?.id)));
  }

  protected generateServiceMethodContent(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    builder
      .addImport('UrlBuilder', this.getUtilPath(ctx, 'url-builder.ts'))
      .appendLine('const url = new UrlBuilder(this._options.baseUrl)')
      .indent((builder) =>
        builder
          .appendLine(`.withPath(${this.toStringLiteral(ctx, endpoint.path)})`)
          .forEach(
            endpoint.parameters.filter((x) => x.target === 'path' || x.target === 'query'),
            (builder, parameter) =>
              builder
                .appendIf(parameter.target === 'path', `.withPathParam`)
                .appendIf(parameter.target === 'query', `.withQueryParam`)
                .parenthesize(
                  '()',
                  `${this.toStringLiteral(ctx, parameter.name)}, params.${this.toPropertyName(ctx, parameter.name)}`
                )
                .appendLine()
          )
          .appendLine('.build();')
      )
      .append('return (this._options.fetch ?? fetch)')
      .parenthesize(
        '()',
        (builder) =>
          builder.append('url, ').parenthesize(
            '{}',
            (builder) =>
              builder
                .appendLine('method: ', this.toStringLiteral(ctx, toCasing(endpoint.method, 'all-upper')), ',')
                .appendLine('headers: this._options.headers,')
                .appendLineIf(!!endpoint.requestBody?.content[0]?.schema, 'body: JSON.stringify(body),'),
            { indent: true, multiline: true }
          ),
        { indent: false }
      )
      .appendLine(' as ', (builder) => this.generateServiceMethodReturnValue(ctx, builder, endpoint), ';');
  }

  protected getTypeName(ctx: Context, builder: Builder, schemaId: string | undefined): string {
    if (!schemaId) {
      return this.getAnyType(ctx);
    }

    const modelInfo = ctx.input.models[schemaId];
    if (!modelInfo) {
      return this.getAnyType(ctx);
    }

    modelInfo.imports.forEach((x) => builder.addImport(x.name, x.modulePath));

    return modelInfo.component;
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

  protected getDefaultOptionsConstantName(ctx: Context): string {
    return toCasing(this.getClassName(ctx) + '-default-options', ctx.config.constantCasing);
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

  protected getUtilPath(ctx: Context, fileName: string) {
    return resolve(ctx.config.outputDir, ctx.config.utilsDirPath, fileName);
  }
}
