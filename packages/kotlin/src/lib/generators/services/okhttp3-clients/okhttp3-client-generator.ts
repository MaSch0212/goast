import { writeFileSync } from 'fs';
import { dirname } from 'path';

import { ensureDirSync } from 'fs-extra';

import { ApiEndpoint, ApiParameter, ApiSchema, toCasing } from '@goast/core';

import { KotlinOkHttp3ClientGeneratorContext, KotlinOkHttp3ClientGeneratorOutput } from './models';
import { KotlinImport } from '../../../common-results';
import { KotlinFileBuilder } from '../../../file-builder';
import { modifyString, toKotlinStringLiteral } from '../../../utils';
import { KotlinFileGenerator } from '../../file-generator';
import { KotlinModelGeneratorOutput } from '../../models';

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
    const typeName = this.getApiClientName(ctx);
    const filePath = this.getFilePath(ctx);
    ensureDirSync(dirname(filePath));

    console.log(`Generating client for service ${ctx.service.name} to ${filePath}...`);

    const builder = new KotlinFileBuilder(ctx.packageName, ctx.config);
    this.generateApiClientFileContent(ctx, builder);

    writeFileSync(filePath, builder.toString());

    return { typeName, packageName: ctx.packageName };
  }

  protected generateApiClientFileContent(ctx: Context, builder: Builder): void {
    builder
      .apply((builder) => this.generateApiClientClassAnnotations(ctx, builder))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateApiClientClassSignature(ctx, builder))
      .append(' ')
      .parenthesizeMultiline('{}', (builder) => this.generateApiClientClassContent(ctx, builder));
  }

  protected generateApiClientClassAnnotations(ctx: Context, builder: Builder): void {
    // None for now
  }

  protected generateApiClientClassSignature(ctx: Context, builder: Builder): void {
    builder
      .append('class ')
      .append(this.getApiClientName(ctx))
      .parenthesizeMultiline('()', (builder) =>
        builder
          .appendLine('basePath: String = defaultBasePath,')
          .appendLine('client: OkHttpClient = ApiClient.defaultClient')
          .addImport('OkHttpClient', 'okhttp3')
          .addImport('ApiClient', ctx.infrastructurePackageName)
      )
      .append(' : ')
      .append('ApiClient(basePath, client)');
  }

  protected generateApiClientClassContent(ctx: Context, builder: Builder): void {
    builder
      .apply((builder) => this.generateApiClientCompanionObject(ctx, builder))
      .forEach(ctx.service.endpoints, (builder, endpoint) =>
        builder
          .ensurePreviousLineEmpty()
          .apply((builder) => this.generateApiClientMethod(ctx, builder, endpoint))
          .ensurePreviousLineEmpty()
          .apply((builder) => this.generateApiClientHttpInfoMethod(ctx, builder, endpoint))
          .ensurePreviousLineEmpty()
          .apply((builder) => this.generateApiClientRequestConfigMethod(ctx, builder, endpoint))
      )
      .ensurePreviousLineEmpty()
      .apply((builder) => this.generateAdditionalMethods(ctx, builder));
  }

  protected generateApiClientCompanionObject(ctx: Context, builder: Builder): void {
    builder
      .append('companion object ')
      .parenthesizeMultiline('{}', (builder) => this.generateApiClientCompanionObjectContent(ctx, builder));
  }

  protected generateApiClientCompanionObjectContent(ctx: Context, builder: Builder): void {
    this.generateApiClientCompanionObjectDefaultBasePathProperty(ctx, builder);
  }

  protected generateApiClientCompanionObjectDefaultBasePathProperty(ctx: Context, builder: Builder): void {
    builder
      .appendAnnotation('JvmStatic')
      .append('val defaultBasePath: String by lazy ')
      .parenthesizeMultiline('{}', (builder) =>
        builder
          .appendLine(
            `System.getProperties().getProperty(ApiClient.baseUrlKey, ${this.toStringLiteral(
              ctx,
              this.getBasePath(ctx)
            )})`
          )
          .addImport('ApiClient', ctx.infrastructurePackageName)
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
      .parenthesizeMultiline('{}', (builder) => this.generateApiClientMethodContent(ctx, builder, endpoint));
  }

  protected generateApiClientMethodDocumentation(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .appendLine('/**')
      .applyWithLinePrefix(' * ', (builder) =>
        builder
          .appendLine(`${endpoint.summary ?? 'TODO: Provide summary'}`)
          .apply((builder) => this.generateParamDocEntries(ctx, builder, endpoint))
          .append('@return ')
          .apply((builder) => this.generateApiClientMethodReturnType(ctx, builder, endpoint))
          .appendLine()
          .appendLine('@throws IllegalStateException If the request is not correctly configured')
          .appendLine('@throws IOException Rethrows the OkHttp execute method exception')
          .appendLine(
            '@throws UnsupportedOperationException If the API returns an informational or redirection response'
          )
          .appendLine('@throws ClientException If the API returns a client error response')
          .appendLine('@throws ServerException If the API returns a server error response')
      )
      .appendLine(' */');
  }

  protected generateApiClientMethodAnnotations(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .appendAnnotation('Throws', undefined, [
        'IllegalStateException::class',
        'IOException::class',
        'UnsupportedOperationException::class',
        'ClientException::class',
        'ServerException::class',
      ])
      .addImport('IOException', 'java.io')
      .addImport('ClientException', ctx.infrastructurePackageName)
      .addImport('ServerException', ctx.infrastructurePackageName);
  }

  protected generateApiClientMethodSignature(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .append('fun ')
      .append(toCasing(endpoint.name, 'camel'))
      .parenthesize('()', (builder) => this.generateApiClientMethodParameters(ctx, builder, endpoint))
      .append(': ')
      .apply((builder) => this.generateApiClientMethodReturnType(ctx, builder, endpoint));
  }

  protected generateApiClientMethodParameters(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    this.generateParams(ctx, builder, endpoint, true);
  }

  protected generateApiClientMethodReturnType(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    this.generateTypeUsage(ctx, builder, this.getResponseSchema(ctx, endpoint), 'Unit');
  }

  protected generateApiClientMethodContent(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    const responseSchema = this.getResponseSchema(ctx, endpoint);
    builder
      .append(`val localVarResponse = ${toCasing(endpoint.name, 'camel')}WithHttpInfo`)
      .parenthesize('()', (builder) => this.generateParams(ctx, builder, endpoint, false))
      .appendLine()
      .appendLine()
      .append('return when (localVarResponse.responseType) ')
      .parenthesizeMultiline('{}', (builder) =>
        builder
          .append('ResponseType.Success -> ')
          .applyIfElse(
            responseSchema === undefined,
            (builder) => builder.append('Unit'),
            (builder) =>
              builder
                .append('(localVarResponse as Success<*>).data as ')
                .addImport('Success', ctx.infrastructurePackageName)
                .apply((builder) => this.generateTypeUsage(ctx, builder, responseSchema))
          )
          .ensureCurrentLineEmpty()
          .appendLine(responseErrorHandlingCode)
          .addImport('ClientError', ctx.infrastructurePackageName)
          .addImport('ServerError', ctx.infrastructurePackageName)
          .addImport('ResponseType', ctx.infrastructurePackageName)
      );
  }

  protected generateApiClientHttpInfoMethod(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .apply((builder) => this.generateApiClientHttpInfoMethodDocumentation(ctx, builder, endpoint))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateApiClientHttpInfoMethodAnnotations(ctx, builder, endpoint))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateApiClientHttpInfoMethodSignature(ctx, builder, endpoint))
      .append(' ')
      .parenthesizeMultiline('{}', (builder) => this.generateApiClientHttpInfoMethodContent(ctx, builder, endpoint));
  }

  protected generateApiClientHttpInfoMethodDocumentation(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .appendLine('/**')
      .applyWithLinePrefix(' * ', (builder) =>
        builder
          .appendLine(`${endpoint.summary ?? 'TODO: Provide summary'}`)
          .apply((builder) => this.generateParamDocEntries(ctx, builder, endpoint))
          .append('@return ')
          .apply((builder) => this.generateApiClientHttpInfoMethodReturnType(ctx, builder, endpoint))
          .appendLine()
          .appendLine('@throws IllegalStateException If the request is not correctly configured')
          .appendLine('@throws IOException Rethrows the OkHttp execute method exception')
          .appendLine(
            '@throws UnsupportedOperationException If the API returns an informational or redirection response'
          )
          .appendLine('@throws ClientException If the API returns a client error response')
          .appendLine('@throws ServerException If the API returns a server error response')
      )
      .appendLine(' */');
  }

  protected generateApiClientHttpInfoMethodAnnotations(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .appendAnnotation('Throws', undefined, ['IllegalStateException::class', 'IOException::class'])
      .addImport('IOException', 'java.io');
  }

  protected generateApiClientHttpInfoMethodSignature(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .append('fun ')
      .append(toCasing(endpoint.name, 'camel'), 'WithHttpInfo')
      .parenthesize('()', (builder) => this.generateApiClientHttpInfoMethodSignatureParameters(ctx, builder, endpoint))
      .append(': ')
      .apply((builder) => this.generateApiClientHttpInfoMethodReturnType(ctx, builder, endpoint));
  }

  protected generateApiClientHttpInfoMethodSignatureParameters(
    ctx: Context,
    builder: Builder,
    endpoint: ApiEndpoint
  ): void {
    this.generateParams(ctx, builder, endpoint, true);
  }

  protected generateApiClientHttpInfoMethodReturnType(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .append('ApiResponse')
      .addImport('ApiResponse', ctx.infrastructurePackageName)
      .parenthesize('<>', (builder) =>
        this.generateTypeUsage(ctx, builder, this.getResponseSchema(ctx, endpoint), 'Unit', true)
      );
  }

  protected generateApiClientHttpInfoMethodContent(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .append(`val localVariableConfig = ${toCasing(endpoint.name, 'camel')}RequestConfig`)
      .parenthesize('()', (builder) => this.generateParams(ctx, builder, endpoint, false))
      .appendLine()
      .appendLine()
      .append('return request')
      .parenthesize('<>', (builder) =>
        builder
          .apply((builder) => this.generateTypeUsage(ctx, builder, endpoint.requestBody?.content[0].schema, 'Unit'))
          .append(', ')
          .apply((builder) => this.generateTypeUsage(ctx, builder, this.getResponseSchema(ctx, endpoint), 'Unit'))
      )
      .parenthesizeMultiline('()', (builder) => builder.append('localVariableConfig'));
  }

  protected generateApiClientRequestConfigMethod(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .apply((builder) => this.generateApiClientRequestConfigMethodDocumentation(ctx, builder, endpoint))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateApiClientRequestConfigMethodAnnotations(ctx, builder, endpoint))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateApiClientRequestConfigMethodSignature(ctx, builder, endpoint))
      .append(' ')
      .parenthesizeMultiline('{}', (builder) =>
        this.generateApiClientRequestConfigMethodContent(ctx, builder, endpoint)
      );
  }

  protected generateApiClientRequestConfigMethodDocumentation(
    ctx: Context,
    builder: Builder,
    endpoint: ApiEndpoint
  ): void {
    builder
      .appendLine('/**')
      .applyWithLinePrefix(' * ', (builder) =>
        builder
          .appendLine(`To obtain the request config of the operation ${toCasing(endpoint.name, 'camel')}`)
          .apply((builder) => this.generateParamDocEntries(ctx, builder, endpoint))
          .append('@return RequestConfig')
      )
      .appendLine(' */');
  }

  protected generateApiClientRequestConfigMethodAnnotations(
    ctx: Context,
    builder: Builder,
    endpoint: ApiEndpoint
  ): void {
    // No annotations needed
  }

  protected generateApiClientRequestConfigMethodSignature(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .append('private fun ')
      .append(toCasing(endpoint.name, 'camel'), 'RequestConfig')
      .parenthesize('()', (builder) =>
        this.generateApiClientRequestConfigMethodSignatureParameters(ctx, builder, endpoint)
      )
      .append(': ')
      .apply((builder) => this.generateApiClientRequestConfigMethodReturnType(ctx, builder, endpoint));
  }

  protected generateApiClientRequestConfigMethodSignatureParameters(
    ctx: Context,
    builder: Builder,
    endpoint: ApiEndpoint
  ): void {
    this.generateParams(ctx, builder, endpoint, true);
  }

  protected generateApiClientRequestConfigMethodReturnType(
    ctx: Context,
    builder: Builder,
    endpoint: ApiEndpoint
  ): void {
    builder
      .append('RequestConfig')
      .addImport('RequestConfig', ctx.infrastructurePackageName)
      .parenthesize('<>', (builder) =>
        this.generateTypeUsage(ctx, builder, endpoint.requestBody?.content[0].schema, 'Unit')
      );
  }

  protected generateApiClientRequestConfigMethodContent(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    const queryParameters = endpoint.parameters.filter((x) => x.target === 'query');
    builder
      .appendLineIf(
        !!endpoint.requestBody,
        `val localVariableBody = ${toCasing(this.getRequestBodyParamName(ctx, endpoint), 'camel')}`
      )
      .appendLine('val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()')
      .addImport('MultiValueMap', ctx.infrastructurePackageName)
      .applyIf(queryParameters.length > 0, (builder) =>
        builder.indent((builder) =>
          builder.append('.apply ').parenthesizeMultiline('{}', (builder) =>
            builder.forEach(queryParameters, (builder, param) =>
              builder
                .appendIf(!param.required, `if (${toCasing(param.name, 'camel')} != null) `)
                .parenthesizeMultilineIf(!param.required, '{}', (builder) =>
                  builder.appendLine(
                    `put(${this.toStringLiteral(ctx, toCasing(param.name, 'camel'))}, listOf(${toCasing(
                      param.name,
                      'camel'
                    )}.toString()))`
                  )
                )
                .appendLine()
            )
          )
        )
      )
      .ensureCurrentLineEmpty()
      .appendLine('val localVariableHeaders: MutableMap<String, String> = mutableMapOf()')
      .appendLineIf(
        endpoint.requestBody?.content[0] !== undefined,
        `localVariableHeaders["Content-Type"] = "${endpoint.requestBody?.content[0].type}"`
      )
      .appendLine()
      .append('return RequestConfig')
      .addImport('RequestConfig', ctx.infrastructurePackageName)
      .parenthesizeMultiline('()', (builder) =>
        builder
          .appendLine(`method = RequestMethod.${endpoint.method.toUpperCase()},`)
          .addImport('RequestMethod', ctx.infrastructurePackageName)
          .appendLine(`path = "${this.getPathWithInterpolation(ctx, endpoint)}",`)
          .appendLine('query = localVariableQuery,')
          .appendLine('headers = localVariableHeaders,')
          .appendLine('requiresAuthentication = false,')
          .appendLineIf(!!endpoint.requestBody, 'body = localVariableBody')
      );
  }

  protected generateAdditionalMethods(ctx: Context, builder: Builder): void {
    this.generateEncodeUriComponentMethod(ctx, builder);
  }

  protected generateEncodeUriComponentMethod(ctx: Context, builder: Builder): void {
    builder
      .appendLine('private fun encodeURIComponent(uriComponent: String): String =')
      .indent(
        'HttpUrl.Builder().scheme("http").host("localhost").addPathSegment(uriComponent).build().encodedPathSegments[0]'
      )
      .addImport('HttpUrl', 'okhttp3');
  }

  protected generateParamDocEntries(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    const parameters = this.getAllParameters(ctx, endpoint);
    builder.forEach(parameters, (builder, parameter) =>
      builder.appendLine(`@param ${parameter.name} ${parameter.description ?? 'TODO: Provide description'}`)
    );
  }

  protected generateParams(
    ctx: Context,
    builder: Builder,
    endpoint: ApiEndpoint,
    includeTypeDefinition: boolean
  ): void {
    const parameters = this.getAllParameters(ctx, endpoint);
    builder.forEachSeparated(parameters, ', ', (builder, parameter) =>
      builder.append(toCasing(parameter.name, 'camel')).applyIf(includeTypeDefinition, (builder) =>
        builder
          .append(': ')
          .apply((builder) => this.generateTypeUsage(ctx, builder, parameter.schema))
          .appendIf(!parameter.required, '? = ', this.getDefaultValue(ctx, parameter.schema))
      )
    );
  }

  protected generateTypeUsage(
    ctx: Context,
    builder: Builder,
    schema: ApiSchema | undefined,
    fallback?: string,
    nullable?: boolean
  ): void {
    if (schema && schema.kind === 'array') {
      const schemaInfo = this.getSchemaInfo(ctx, schema.items);
      builder.append(this.getTypeNameWithNullability(`List<${schemaInfo.typeName}>`, nullable));
      builder.imports.addImports([schemaInfo, ...schemaInfo.additionalImports]);
    } else if (schema || !fallback) {
      const schemaInfo = this.getSchemaInfo(ctx, schema);
      builder.append(this.getTypeNameWithNullability(schemaInfo.typeName, nullable));
      builder.imports.addImports([schemaInfo, ...schemaInfo.additionalImports]);
    } else {
      builder.append(this.getTypeNameWithNullability(fallback, nullable));
    }
  }

  protected getTypeNameWithNullability(typeName: string, nullable: boolean | undefined): string {
    if (nullable === undefined) return typeName;
    return nullable ? `${typeName}?` : typeName.match(/^(.*?)\??$/)![1];
  }

  protected getDefaultValue(ctx: Context, schema: ApiSchema | undefined): string {
    if (!schema?.default) {
      return 'null';
    }

    if (typeof schema.default === 'string') {
      return toKotlinStringLiteral(schema.default);
    } else if (typeof schema.default === 'number' || typeof schema.default === 'boolean') {
      return schema.default.toString();
    } else {
      return 'null';
    }
  }

  protected getPathWithInterpolation(ctx: Context, endpoint: ApiEndpoint): string {
    let path = this.getEndpointPath(ctx, endpoint);
    endpoint.parameters
      .filter((x) => x.target === 'path')
      .forEach((parameter) => {
        path = path.replace(
          `{${parameter.name}}`,
          `\${encodeURIComponent(${toCasing(parameter.name, 'camel')}.toString())}`
        );
      });
    return path;
  }

  protected getResponseSchema(ctx: Context, endpoint: ApiEndpoint): ApiSchema | undefined {
    return endpoint.responses.find((x) => !x.statusCode || (x.statusCode >= 200 && x.statusCode < 300))
      ?.contentOptions[0]?.schema;
  }

  protected getSchemaInfo(ctx: Context, schema: ApiSchema | undefined): KotlinModelGeneratorOutput {
    return (
      (schema && ctx.input.models[schema.id]) ?? { typeName: 'Any?', packageName: undefined, additionalImports: [] }
    );
  }

  protected getAllParameters(ctx: Context, endpoint: ApiEndpoint): ApiParameter[] {
    const parameters = endpoint.parameters.filter(
      (parameter) => parameter.target === 'query' || parameter.target === 'path'
    );
    if (endpoint.requestBody) {
      const schema = endpoint.requestBody.content[0].schema;
      parameters.push({
        $src: undefined!,
        $ref: undefined,
        id: 'body',
        name: this.getRequestBodyParamName(ctx, endpoint),
        target: 'body',
        schema,
        required: endpoint.requestBody.required,
        description: endpoint.requestBody.description,
        allowEmptyValue: undefined,
        allowReserved: undefined,
        deprecated: false,
        explode: undefined,
        style: undefined,
      });
    }

    return parameters.sort((a, b) => (a.required === b.required ? 0 : a.required ? -1 : 1));
  }

  protected getRequestBodyParamName(ctx: Context, endpoint: ApiEndpoint): string {
    const schema = endpoint.requestBody?.content[0].schema;
    const schemaInfo = this.getSchemaInfo(ctx, schema);
    return /^Any\??$/.test(schemaInfo.typeName) ? 'body' : schemaInfo.typeName;
  }

  protected getBasePath(ctx: Context): string {
    return modifyString(
      (ctx.service.$src ?? ctx.service.endpoints[0]?.$src)?.document.servers?.[0]?.url ?? '/',
      ctx.config.basePath,
      ctx.service
    );
  }

  protected getEndpointPath(ctx: Context, endpoint: ApiEndpoint): string {
    return modifyString(endpoint.path, ctx.config.pathModifier, endpoint);
  }

  protected getFilePath(ctx: Context): string {
    return `${ctx.config.outputDir}/${ctx.packageName.replace(/\./g, '/')}/${this.getApiClientName(ctx)}.kt`;
  }

  protected getApiClientName(ctx: Context): string {
    return toCasing(ctx.service.name, 'pascal') + 'ApiClient';
  }
}

const responseErrorHandlingCode = `ResponseType.Informational -> throw UnsupportedOperationException("Client does not support Informational responses.")
ResponseType.Redirection -> throw UnsupportedOperationException("Client does not support Redirection responses.")
ResponseType.ClientError -> {
    val localVarError = localVarResponse as ClientError<*>
    throw ClientException(
        "Client error : \${localVarError.statusCode} \${localVarError.message.orEmpty()}",
        localVarError.statusCode,
        localVarResponse
    )
}

ResponseType.ServerError -> {
    val localVarError = localVarResponse as ServerError<*>
    throw ServerException(
        "Server error : \${localVarError.statusCode} \${localVarError.message.orEmpty()}",
        localVarError.statusCode,
        localVarResponse
    )
}`;
