import { ensureDirSync, writeFileSync } from 'fs-extra';

import { ApiEndpoint, ApiParameter, ApiSchema, toCasing } from '@goast/core';

import { KotlinServiceGeneratorContext, KotlinServiceGeneratorOutput } from './models';
import { KotlinImport } from '../../../common-results';
import { KotlinFileBuilder } from '../../../file-builder';
import { KotlinFileGenerator } from '../../file-generator';
import { KotlinModelGeneratorOutput } from '../../models';

type Context = KotlinServiceGeneratorContext;
type Output = KotlinServiceGeneratorOutput;
type Builder = KotlinFileBuilder;

export interface KotlinSpringControllerGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): TOutput;
}

export class DefaultKotlinSpringControllerGenerator
  extends KotlinFileGenerator<Context, Output>
  implements KotlinSpringControllerGenerator
{
  generate(ctx: KotlinServiceGeneratorContext): KotlinServiceGeneratorOutput {
    const packageName = this.getPackageName(ctx);
    const dirPath = this.getDirectoryPath(ctx, packageName);
    ensureDirSync(dirPath);

    console.log(`Generating service ${ctx.service.id} to ${dirPath}...`);
    return {
      apiInterface: this.generateApiInterfaceFile(ctx, dirPath, packageName),
      apiController: this.generateApiControllerFile(ctx, dirPath, packageName),
      apiDelegate: this.generateApiDelegateInterfaceFile(ctx, dirPath, packageName),
    };
  }

  protected generateApiInterfaceFile(ctx: Context, dirPath: string, packageName: string): KotlinImport {
    const typeName = this.getApiInterfaceName(ctx);
    const fileName = `${typeName}.kt`;
    const filePath = `${dirPath}/${fileName}`;
    console.log(`  Generating API interface ${typeName} to ${fileName}...`);

    const builder = new KotlinFileBuilder(packageName, ctx.config);
    this.generateApiInterfaceFileContent(ctx, builder);

    writeFileSync(filePath, builder.toString());

    return { typeName: builder.toString(), packageName };
  }

  protected generateApiInterfaceFileContent(ctx: Context, builder: Builder): void {
    builder
      .apply((builder) => this.generateApiInterfaceAnnotations(ctx, builder))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateApiInterfaceSignature(ctx, builder))
      .append(' ')
      .parenthesizeMultiline('{}', (builder) => this.generateApiInterfaceContent(ctx, builder));
  }

  protected generateApiInterfaceAnnotations(ctx: Context, builder: Builder): void {
    builder
      .appendAnnotation('Validated', 'org.springframework.validation.annotation')
      .appendAnnotation('RequestMapping', 'org.springframework.web.bind.annotation', [
        this.getControllerRequestMapping(ctx, 'api'),
      ]);
  }

  protected generateApiInterfaceSignature(ctx: Context, builder: Builder): void {
    builder.append('interface ').append(this.getApiInterfaceName(ctx));
  }

  protected generateApiInterfaceContent(ctx: Context, builder: Builder): void {
    builder
      .apply((builder) => this.generateApiInterfaceDelegateAccessor(ctx, builder))
      .ensurePreviousLineEmpty()
      .apply((builder) => this.generateApiInterfaceMethods(ctx, builder));
  }

  protected generateApiInterfaceDelegateAccessor(ctx: Context, builder: Builder): void {
    builder.appendLine(
      `fun getDelegate(): ${this.getApiDelegateInterfaceName(ctx)} = object : ${this.getApiDelegateInterfaceName(
        ctx
      )} {}`
    );
  }

  protected generateApiInterfaceMethods(ctx: Context, builder: Builder): void {
    builder.forEach(ctx.service.endpoints, (builder, endpoint) =>
      builder.ensurePreviousLineEmpty().apply((builder) => this.generateApiInterfaceMethod(ctx, builder, endpoint))
    );
  }

  protected generateApiInterfaceMethod(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .apply((builder) => this.generateApiInterfaceMethodAnnnotations(ctx, builder, endpoint))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateApiInterfaceMethodSignature(ctx, builder, endpoint))
      .append(' ')
      .parenthesizeMultiline('{}', (builder) => this.generateApiInterfaceMethodContent(ctx, builder, endpoint));
  }

  protected generateApiInterfaceMethodAnnnotations(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .appendAnnotation('Operation', 'io.swagger.v3.oas.annotations', [
        ['summary', this.toStringLiteral(ctx, endpoint.summary?.trim())],
        ['operationId', this.toStringLiteral(ctx, endpoint.name)],
        ['description', this.toStringLiteral(ctx, endpoint.description?.trim())],
        [
          'responses',
          (builder) =>
            builder.parenthesizeMultiline('[]', (builder) =>
              builder.forEachSeparated(endpoint.responses, ',\n', (builder, response) =>
                builder
                  .append('ApiResponse')
                  .addImport('ApiResponse', 'io.swagger.v3.oas.annotations.responses')
                  .parenthesize('()', (builder) =>
                    builder
                      .append(`responseCode = ${this.toStringLiteral(ctx, response.statusCode?.toString())}, `)
                      .append(`description = ${this.toStringLiteral(ctx, response.description?.trim())}`)
                  )
              )
            ),
          endpoint.responses.length > 0,
        ],
      ])
      .appendAnnotation('RequestMapping', 'org.springframework.web.bind.annotation', [
        ['method', '[RequestMethod.' + endpoint.method.toUpperCase() + ']'],
        ['value', '[' + this.toStringLiteral(ctx, endpoint.path) + ']'],
        [
          'consumes',
          '[' + endpoint.requestBody?.content.map((x) => this.toStringLiteral(ctx, x.type)).join(', ') + ']',
          !!endpoint.requestBody && endpoint.requestBody.content.length > 0,
        ],
      ])
      .addImport('RequestMethod', 'org.springframework.web.bind.annotation');
  }

  protected generateApiInterfaceMethodSignature(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .append(`suspend fun ${toCasing(endpoint.name, 'camel')}`)
      .parenthesizeMultiline('()', (builder) => this.generateApiInterfaceMethodParameters(ctx, builder, endpoint))
      .append(': ')
      .apply((builder) => this.generateApiInterfaceMethodReturnType(ctx, builder, endpoint));
  }

  protected generateApiInterfaceMethodParameters(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    const parameters = this.getAllParameters(ctx, endpoint);
    builder.forEachSeparated(parameters, ',\n', (builder, parameter) =>
      this.generateApiInterfaceMethodParameter(ctx, builder, endpoint, parameter)
    );
  }

  protected generateApiInterfaceMethodReturnType(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    this.generateResponseEntityType(ctx, builder, endpoint.responses[0]?.contentOptions[0]?.schema);
  }

  protected generateApiInterfaceMethodParameter(
    ctx: Context,
    builder: Builder,
    endpoint: ApiEndpoint,
    parameter: ApiParameter
  ): void {
    builder
      .apply((builder) => this.generateApiInterfaceMethodParameterAnnotations(ctx, builder, endpoint, parameter))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateApiInterfaceMethodParameterSignature(ctx, builder, endpoint, parameter));
  }

  protected generateApiInterfaceMethodParameterAnnotations(
    ctx: Context,
    builder: Builder,
    endpoint: ApiEndpoint,
    parameter: ApiParameter
  ): void {
    const parameterSchemaInfo = this.getSchemaInfo(ctx, parameter.schema);

    if (parameter.schema?.default !== undefined) {
      builder.addImport('Schema', 'io.swagger.v3.oas.annotations.media');
    }
    builder.appendAnnotation('Parameter', 'io.swagger.v3.oas.annotations', [
      ['description', this.toStringLiteral(ctx, parameter.description?.trim())],
      ['required', parameter.required?.toString()],
      [
        'schema',
        `Schema(defaultValue = ${this.toStringLiteral(ctx, String(parameter.schema?.default))})`,
        parameter.schema?.default !== undefined,
      ],
    ]);

    if (parameterSchemaInfo.packageName) {
      builder.appendAnnotation('Valid', 'jakarta.validation');
    }

    if (parameter.target === 'body') {
      builder.appendAnnotation('RequestBody', 'org.springframework.web.bind.annotation');
    }

    if (parameter.target === 'query') {
      builder.appendAnnotation('RequestParam', 'org.springframework.web.bind.annotation', [
        ['value', this.toStringLiteral(ctx, parameter.name)],
        ['required', parameter.required?.toString()],
        [
          'defaultValue',
          this.toStringLiteral(ctx, String(parameter.schema?.default)),
          parameter.schema?.default !== undefined,
        ],
      ]);
    }

    if (parameter.target === 'path') {
      builder.appendAnnotation('PathVariable', 'org.springframework.web.bind.annotation', [
        this.toStringLiteral(ctx, parameter.name),
      ]);
    }
  }

  protected generateApiInterfaceMethodParameterSignature(
    ctx: Context,
    builder: Builder,
    endpoint: ApiEndpoint,
    parameter: ApiParameter
  ): void {
    builder
      .append(toCasing(parameter.name, 'camel'))
      .append(': ')
      .apply((builder) => this.generateTypeUsage(ctx, builder, parameter.schema));
  }

  protected generateApiInterfaceMethodContent(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    const parameters = this.getAllParameters(ctx, endpoint);
    builder
      .append(`return getDelegate().${toCasing(endpoint.name, 'camel')}(`)
      .forEachSeparated(parameters, ', ', (builder, parameter) => builder.append(toCasing(parameter.name, 'camel')))
      .append(')');
  }

  protected generateApiControllerFile(ctx: Context, dirPath: string, packageName: string): KotlinImport {
    const typeName = this.getApiControllerName(ctx);
    const fileName = `${typeName}.kt`;
    const filePath = `${dirPath}/${fileName}`;
    console.log(`  Generating API controller ${typeName} to ${fileName}...`);

    const builder = new KotlinFileBuilder(packageName, ctx.config);
    this.generateApiControllerFileContent(ctx, builder);

    writeFileSync(filePath, builder.toString());

    return { typeName: builder.toString(), packageName };
  }

  protected generateApiControllerFileContent(ctx: Context, builder: Builder): void {
    builder
      .apply((builder) => this.generateApiControllerAnnotations(ctx, builder))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateApiControllerSignature(ctx, builder))
      .append(' ')
      .parenthesizeMultiline('{}', (builder) => this.generateApiControllerContent(ctx, builder));
  }

  protected generateApiControllerAnnotations(ctx: Context, builder: Builder): void {
    builder
      .appendAnnotation('Generated', 'jakarta.annotation', [
        ['value', '[' + this.toStringLiteral(ctx, 'com.goast.kotlin.spring-service-generator') + ']'],
      ])
      .appendAnnotation('Controller', 'org.springframework.stereotype')
      .appendAnnotation('RequestMapping', 'org.springframework.web.bind.annotation', [
        this.getControllerRequestMapping(ctx),
      ]);
  }

  protected generateApiControllerSignature(ctx: Context, builder: Builder): void {
    builder
      .append('class ')
      .append(this.getApiControllerName(ctx))
      .parenthesizeMultiline('()', (builder) => this.generateApiControllerParameters(ctx, builder))
      .append(' : ')
      .append(this.getApiInterfaceName(ctx));
  }

  protected generateApiControllerParameters(ctx: Context, builder: Builder): void {
    builder
      .appendAnnotation('Autowired', 'org.springframework.beans.factory.annotation', [['required', 'false']])
      .append('delegate: ')
      .append(this.getApiDelegateInterfaceName(ctx))
      .append('?');
  }

  protected generateApiControllerContent(ctx: Context, builder: Builder): void {
    builder
      .append('private val delegate: ')
      .appendLine(this.getApiDelegateInterfaceName(ctx))
      .appendLine()
      .append('init ')
      .parenthesizeMultiline('{}', (builder) =>
        builder
          .append('this.delegate = Optional.ofNullable(delegate).orElse')
          .addImport('Optional', 'java.util')
          .parenthesize('()', (builder) =>
            builder.append('object : ').append(this.getApiDelegateInterfaceName(ctx)).append(' {}')
          )
      )
      .appendLine()
      .appendLine()
      .appendLine(`override fun getDelegate(): ${this.getApiDelegateInterfaceName(ctx)} = delegate`);
  }

  protected generateApiDelegateInterfaceFile(ctx: Context, dirPath: string, packageName: string): KotlinImport {
    const typeName = this.getApiDelegateInterfaceName(ctx);
    const fileName = `${typeName}.kt`;
    const filePath = `${dirPath}/${fileName}`;
    console.log(`  Generating API delegate ${typeName} to ${fileName}...`);

    const builder = new KotlinFileBuilder(packageName, ctx.config);
    this.generateApiDelegateInterfaceFileContent(ctx, builder);

    writeFileSync(filePath, builder.toString());

    return { typeName: builder.toString(), packageName };
  }

  protected generateApiDelegateInterfaceFileContent(ctx: Context, builder: Builder): void {
    builder
      .apply((builder) => this.generateApiDelegateInterfaceAnnotations(ctx, builder))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateApiDelegateInterfaceSignature(ctx, builder))
      .append(' ')
      .parenthesizeMultiline('{}', (builder) => this.generateApiDelegateInterfaceContent(ctx, builder));
  }

  protected generateApiDelegateInterfaceAnnotations(ctx: Context, builder: Builder): void {
    builder.appendAnnotation('Generated', 'jakarta.annotation', [
      ['value', '[' + this.toStringLiteral(ctx, 'com.goast.kotlin.spring-service-generator') + ']'],
    ]);
  }

  protected generateApiDelegateInterfaceSignature(ctx: Context, builder: Builder): void {
    builder.append('interface ').append(this.getApiDelegateInterfaceName(ctx));
  }

  protected generateApiDelegateInterfaceContent(ctx: Context, builder: Builder): void {
    builder
      .appendLine(`fun getRequest(): Optional<NativeWebRequest> = Optional.empty()`)
      .addImport('Optional', 'java.util')
      .addImport('NativeWebRequest', 'org.springframework.web.context.request')
      .forEach(ctx.service.endpoints, (builder, endpoint) =>
        builder
          .ensurePreviousLineEmpty()
          .apply((builder) => this.generateApiDelegateInterfaceMethod(ctx, builder, endpoint))
      );
  }

  protected generateApiDelegateInterfaceMethod(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .apply((builder) => this.generateApiDelegateInterfaceMethodAnnnotations(ctx, builder, endpoint))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateApiDelegateInterfaceMethodSignature(ctx, builder, endpoint))
      .append(' ')
      .parenthesizeMultiline('{}', (builder) => this.generateApiDelegateInterfaceMethodContent(ctx, builder, endpoint));
  }

  protected generateApiDelegateInterfaceMethodAnnnotations(
    ctx: Context,
    builder: Builder,
    endpoint: ApiEndpoint
  ): void {
    // None for now.
  }

  protected generateApiDelegateInterfaceMethodSignature(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .append(`suspend fun ${toCasing(endpoint.name, 'camel')}`)
      .parenthesizeMultiline('()', (builder) =>
        this.generateApiDelegateInterfaceMethodParameters(ctx, builder, endpoint)
      )
      .append(': ')
      .apply((builder) => this.generateApiDelegateInterfaceMethodReturnType(ctx, builder, endpoint));
  }

  protected generateApiDelegateInterfaceMethodParameters(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    const parameters = this.getAllParameters(ctx, endpoint);
    builder.forEachSeparated(parameters, ',\n', (builder, parameter) =>
      this.generateApiDelegateInterfaceMethodParameter(ctx, builder, endpoint, parameter)
    );
  }

  protected generateApiDelegateInterfaceMethodReturnType(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    this.generateResponseEntityType(ctx, builder, endpoint.responses[0]?.contentOptions[0]?.schema);
  }

  protected generateApiDelegateInterfaceMethodParameter(
    ctx: Context,
    builder: Builder,
    endpoint: ApiEndpoint,
    parameter: ApiParameter
  ): void {
    builder
      .apply((builder) =>
        this.generateApiDelegateInterfaceMethodParameterAnnotations(ctx, builder, endpoint, parameter)
      )
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateApiDelegateInterfaceMethodParameterSignature(ctx, builder, endpoint, parameter));
  }

  protected generateApiDelegateInterfaceMethodParameterAnnotations(
    ctx: Context,
    builder: Builder,
    endpoint: ApiEndpoint,
    parameter: ApiParameter
  ): void {
    // None for now.
  }

  protected generateApiDelegateInterfaceMethodParameterSignature(
    ctx: Context,
    builder: Builder,
    endpoint: ApiEndpoint,
    parameter: ApiParameter
  ): void {
    builder
      .append(toCasing(parameter.name, 'camel'))
      .append(': ')
      .apply((builder) => this.generateTypeUsage(ctx, builder, parameter.schema));
  }

  protected generateApiDelegateInterfaceMethodContent(ctx: Context, builder: Builder, endpoint: ApiEndpoint): void {
    builder
      .appendLine('return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)')
      .addImport('ResponseEntity', 'org.springframework.http')
      .addImport('HttpStatus', 'org.springframework.http');
  }

  protected generateResponseEntityType(ctx: Context, builder: Builder, schema: ApiSchema | undefined): void {
    builder
      .append('ResponseEntity')
      .addImport('ResponseEntity', 'org.springframework.http')
      .parenthesize('<>', (builder) => this.generateTypeUsage(ctx, builder, schema, 'Unit'));
  }

  protected generateTypeUsage(ctx: Context, builder: Builder, schema: ApiSchema | undefined, fallback?: string): void {
    if (schema && schema.kind === 'array') {
      const schemaInfo = this.getSchemaInfo(ctx, schema.items);
      builder.append(`Flux<${schemaInfo.typeName}>`).addImport('Flux', 'reactor.core.publisher');
      builder.imports.addImports([schemaInfo, ...schemaInfo.additionalImports]);
    } else if (schema || !fallback) {
      const schemaInfo = this.getSchemaInfo(ctx, schema);
      builder.append(schemaInfo.typeName);
      builder.imports.addImports([schemaInfo, ...schemaInfo.additionalImports]);
    } else {
      builder.append(fallback);
    }
  }

  protected getControllerRequestMapping(ctx: Context, prefix?: string): string {
    const basePath = (ctx.service.$src ?? ctx.service.endpoints[0]?.$src)?.document.servers?.[0]?.url ?? '/';
    prefix ??= `openapi.${toCasing(ctx.service.name, 'camel')}`;
    return this.toStringLiteral(ctx, `\${${prefix}.base-path:${basePath}}`);
  }

  protected getDirectoryPath(ctx: Context, packageName: string): string {
    return `${ctx.config.outputDir}/${packageName.replace(/\./g, '/')}`;
  }

  protected getPackageName(ctx: Context): string {
    return ctx.config.packageName + ctx.config.packageSuffix;
  }

  protected getApiInterfaceName(ctx: Context): string {
    return toCasing(ctx.service.name, 'pascal') + 'Api';
  }

  protected getApiControllerName(ctx: Context): string {
    return toCasing(ctx.service.name, 'pascal') + 'ApiController';
  }

  protected getApiDelegateInterfaceName(ctx: Context): string {
    return toCasing(ctx.service.name, 'pascal') + 'ApiDelegate';
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
        name: schema ? this.getSchemaInfo(ctx, schema).typeName : 'body',
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

    return parameters;
  }

  protected sortParameters(ctx: Context, parameters: Iterable<ApiParameter>): ApiParameter[] {
    return [...parameters].sort((a, b) => {
      const aRequired = a.required ? 1 : 0;
      const bRequired = b.required ? 1 : 0;
      return aRequired - bRequired;
    });
  }
}
