import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

import { ensureDirSync } from 'fs-extra';

import { ApiEndpoint, toCasing } from '@goast/core';

import { TypeScriptAngularClientGeneratorContext, TypeScriptAngularClientGeneratorOutput } from './models';
import { TypeScriptClassOptions, TypeScriptConstructorOptions, TypeScriptFileBuilder } from '../../../file-builder';
import { TypeScriptFileGenerator } from '../../file-generator';

type Context = TypeScriptAngularClientGeneratorContext;
type Output = TypeScriptAngularClientGeneratorOutput;
type Builder = TypeScriptFileBuilder;

export interface TypeScriptAngularClientGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): TOutput;
}

export class DefaultTypeScriptAngularClientGenerator
  extends TypeScriptFileGenerator<Context, Output>
  implements TypeScriptAngularClientGenerator
{
  public generate(ctx: Context): Output {
    const filePath = this.getFilePath(ctx);
    const name = this.getClassName(ctx);
    console.log(`Generating service ${name} in ${filePath}...`);

    const builder = new TypeScriptFileBuilder(filePath, ctx.config);
    this.generateClass(ctx, builder);

    ensureDirSync(dirname(filePath));
    writeFileSync(filePath, builder.toString());

    return { filePath, name };
  }

  protected generateClass(ctx: Context, builder: Builder) {
    builder.appendClass(this.getClassOptions(ctx), (builder) => this.generateClassContent(ctx, builder));
  }

  protected getClassOptions(ctx: Context): TypeScriptClassOptions {
    return {
      name: this.getClassName(ctx),
      documentation: ctx.service.description,
      annotations: [
        {
          name: 'Injectable',
          moduleName: '@angular/core',
          args: [(builder) => builder.appendObjectLiteral(`providedIn: ${this.toStringLiteral(ctx, 'root')}`)],
        },
      ],
      extends: (builder) =>
        builder
          .append('BaseService')
          .addFileImport('BaseService', resolve(this.getUtilsDirPath(ctx), 'base-service.ts')),
    };
  }

  protected generateClassContent(ctx: Context, builder: Builder) {
    builder
      .append((builder) => this.generateConstructor(ctx, builder))
      .forEach(ctx.service.endpoints, (builder, endpoint) => this.generateEndpoint(ctx, builder, endpoint));
  }

  protected generateConstructor(ctx: Context, builder: Builder) {
    builder.appendConstructor(this.getConstructorOptions(ctx), (builder) =>
      this.generateConstructorContent(ctx, builder)
    );
  }

  protected getConstructorOptions(ctx: Context): TypeScriptConstructorOptions {
    return {
      parameters: [
        (builder) =>
          builder
            .append('config: ApiConfiguration')
            .addFileImport('ApiConfiguration', resolve(this.getUtilsDirPath(ctx), 'api-configuration.ts')),
        (builder) => builder.append('http: HttpClient').addModuleImport('HttpClient', '@angular/common/http'),
      ],
    };
  }

  protected generateConstructorContent(ctx: Context, builder: Builder) {
    builder.appendLine('super(config, http);');
  }

  protected generateEndpoint(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    this.generatePathProperty(ctx, builder, endpoint);
  }

  protected generatePathProperty(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    builder
      .ensurePreviousLineEmpty()
      .appendComment('/***/', `Path part for operation ${this.getEndpointMethodName(ctx, endpoint)}`)
      .appendLine(
        'protected static readonly ',
        this.getPathPropertyName(ctx, endpoint),
        ' = ',
        this.toStringLiteral(ctx, endpoint.path),
        ';'
      );
  }

  protected getClassName(ctx: Context): string {
    return this.toTypeName(ctx, ctx.service.name);
  }

  protected getPathPropertyName(ctx: Context, endpoint: ApiEndpoint): string {
    return this.getEndpointMethodName(ctx, endpoint) + 'Path';
  }

  protected getEndpointMethodName(ctx: Context, endpoint: ApiEndpoint): string {
    return this.toMethodName(ctx, endpoint.name);
  }

  protected getEndpointResponseMethodName(ctx: Context, endpoint: ApiEndpoint): string {
    return this.getEndpointMethodName(ctx, endpoint) + '$Response';
  }

  protected getFilePath(ctx: Context): string {
    return resolve(
      ctx.config.outputDir,
      ctx.config.clientDirPath,
      `${toCasing(ctx.service.name, ctx.config.fileNameCasing)}.ts`
    );
  }

  protected getUtilsDirPath(ctx: Context): string {
    return resolve(ctx.config.outputDir, ctx.config.utilsDirPath);
  }
}
