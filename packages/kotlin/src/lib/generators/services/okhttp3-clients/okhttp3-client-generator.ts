import { writeFileSync } from 'fs';
import { dirname } from 'path';

import { ensureDirSync } from 'fs-extra';

import { ApiEndpoint, toCasing } from '@goast/core';

import { KotlinOkHttp3ClientGeneratorContext, KotlinOkHttp3ClientGeneratorOutput } from './models';
import { KotlinImport } from '../../../common-results';
import { KotlinFileBuilder } from '../../../file-builder';
import { KotlinFileGenerator } from '../../file-generator';

type Context = KotlinOkHttp3ClientGeneratorContext;
type Output = KotlinOkHttp3ClientGeneratorOutput;
type Builder = KotlinFileBuilder;

export interface KotlinOkHttp3Generator<TOutput extends Output = Output> {
  generate(ctx: Context): TOutput;
}

export class DefaultKotlinOkHttp3Generator
  extends KotlinFileGenerator<Context, Output>
  implements KotlinOkHttp3Generator
{
  public generate(ctx: KotlinOkHttp3ClientGeneratorContext): KotlinImport {
    const packageName = this.getPackageName(ctx);
    const typeName = this.getApiClientName(ctx);
    const filePath = this.getFilePath(ctx, packageName);
    ensureDirSync(dirname(filePath));

    console.log(`Generating client for service ${ctx.service.name} to ${filePath}...`);

    const builder = new KotlinFileBuilder(packageName, ctx.config);
    this.generateApiClientFileContent(ctx, builder);

    writeFileSync(filePath, builder.toString());

    return { typeName, packageName };
  }

  protected generateApiClientFileContent(ctx: Context, builder: Builder): void {
    builder
      .apply((builder) => this.generateApiClientClassAnnotations(ctx, builder))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateApiClientClassSignature(ctx, builder))
      .append(' ')
      .parenthesize('{}', (builder) =>
        builder
          .appendLine()
          .apply((builder) => this.generateApiClientClassContent(ctx, builder))
          .ensureCurrentLineEmpty()
      );
  }

  protected generateApiClientClassAnnotations(ctx: Context, builder: Builder): void {
    // None for now
  }

  protected generateApiClientClassSignature(ctx: Context, builder: Builder): void {
    builder
      .append('class ')
      .append(this.getApiClientName(ctx))
      .parenthesize('()', (builder) =>
        builder
          .appendLine()
          .appendLine('basePath: String = defaultBasePath,')
          .appendLine('client: OkHttpClient = ApiClient.defaultClient')
          .addImport('OkHttpClient', 'okhttp3')
          .addImport('ApiClient', ctx.config.infrastructurePackageName)
          .ensureCurrentLineEmpty()
      )
      .append(' : ')
      .append('ApiClient(basePath, client)');
  }

  protected generateApiClientClassContent(ctx: Context, builder: Builder): void {
    builder
      .apply((builder) => this.generateApiClientCompanionObject(ctx, builder))
      .forEach(ctx.service.endpoints, (builder, endpoint) =>
        builder.ensurePreviousLineEmpty().apply((builder) => this.generateApiClientMethod(ctx, builder, endpoint))
      );
  }

  protected generateApiClientCompanionObject(ctx: Context, builder: Builder): void {
    builder.append('companion object ').parenthesize('{}', (builder) =>
      builder
        .appendLine()
        .appendAnnotation('JvmStatic')
        .append('val defaultBasePath: String by lazy ')
        .parenthesize('{}', (builder) =>
          builder
            .appendLine()
            .appendLine(
              `System.getProperties().getProperty(ApiClient.baseUrlKey, ${this.toStringLiteral(
                ctx,
                this.getBasePath(ctx)
              )})`
            )
            .addImport('ApiClient', ctx.config.infrastructurePackageName)
            .ensureCurrentLineEmpty()
        )
        .ensureCurrentLineEmpty()
    );
  }

  protected generateApiClientMethod(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .apply((builder) => this.generateApiClientMethodDocumentation(ctx, builder, endpoint))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateApiClientMethodAnnotations(ctx, builder, endpoint))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateApiClientMethodSignature(ctx, builder, endpoint))
      .append(' ')
      .parenthesize('{}', (builder) =>
        builder
          .appendLine()
          .apply((builder) => this.generateApiClientMethodContent(ctx, builder, endpoint))
          .ensureCurrentLineEmpty()
      );
  }

  protected generateApiClientMethodDocumentation(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .appendLine('/**')
      .applyWithLinePrefix(' * ', (builder) =>
        builder
          .appendLine(`${endpoint.summary ?? 'TODO: Provide summary'}`)
          .appendLine('@param request The request to send.')
          .appendLine('@param callback The callback to execute once the request is sent.')
      )
      .appendLine(' */');
  }

  protected generateApiClientMethodAnnotations(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {}

  protected generateApiClientMethodSignature(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {}

  protected generateApiClientMethodContent(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {}

  protected getBasePath(ctx: Context): string {
    return (ctx.service.$src ?? ctx.service.endpoints[0]?.$src)?.document.servers?.[0]?.url ?? '/';
  }

  protected getFilePath(ctx: Context, packageName: string): string {
    return `${ctx.config.outputDir}/${packageName.replace(/\./g, '/')}/${this.getApiClientName(ctx)}.kt`;
  }

  protected getPackageName(ctx: Context): string {
    return ctx.config.packageName + ctx.config.packageSuffix;
  }

  protected getApiClientName(ctx: Context): string {
    return toCasing(ctx.service.name, 'pascal') + 'ApiClient';
  }
}
