// @deno-types="npm:@types/fs-extra@11"
import fs from 'fs-extra';

import {
  type ApiEndpoint,
  type ApiParameter,
  type AppendValueGroup,
  appendValueGroup,
  builderTemplate as s,
  createOverwriteProxy,
  type MaybePromise,
  notNullish,
  resolveAnyOfAndAllOf,
  SourceBuilder,
  toCasing,
} from '@goast/core';

import { kt } from '../../../ast/index.ts';
import type { KotlinImport } from '../../../common-results.ts';
import { KotlinFileBuilder } from '../../../file-builder.ts';
import type { ApiParameterWithMultipartInfo } from '../../../types.ts';
import { modifyString } from '../../../utils.ts';
import { KotlinFileGenerator } from '../../file-generator.ts';
import type { DefaultKotlinSpringControllerGeneratorArgs as Args } from './index.ts';
import type { KotlinServiceGeneratorContext, KotlinServiceGeneratorOutput } from './models.ts';

type Context = KotlinServiceGeneratorContext;
type Output = KotlinServiceGeneratorOutput;
type Builder = KotlinFileBuilder;

export interface KotlinSpringControllerGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): MaybePromise<TOutput>;
}

export class DefaultKotlinSpringControllerGenerator extends KotlinFileGenerator<Context, Output>
  implements KotlinSpringControllerGenerator {
  generate(ctx: KotlinServiceGeneratorContext): MaybePromise<KotlinServiceGeneratorOutput> {
    const packageName = this.getPackageName(ctx, {});
    const dirPath = this.getDirectoryPath(ctx, { packageName });
    fs.ensureDirSync(dirPath);

    console.log(`Generating service ${ctx.service.id} to ${dirPath}...`);
    return {
      apiInterface: this.generateApiInterfaceFile(ctx, { dirPath, packageName }),
      apiController: this.generateApiControllerFile(ctx, { dirPath, packageName }),
      apiDelegate: this.generateApiDelegateInterfaceFile(ctx, { dirPath, packageName }),
    };
  }

  // #region API Interface
  protected generateApiInterfaceFile(ctx: Context, args: Args.GenerateApiInterfaceFile): KotlinImport {
    const { dirPath, packageName } = args;
    const typeName = this.getApiInterfaceName(ctx, {});
    const fileName = `${typeName}.kt`;
    const filePath = `${dirPath}/${fileName}`;
    console.log(`  Generating API interface ${typeName} to ${fileName}...`);

    const builder = new KotlinFileBuilder(packageName, ctx.config);
    builder.append(this.getApiInterfaceFileContent(ctx, { interfaceName: typeName }));
    fs.writeFileSync(filePath, builder.toString());

    return { typeName, packageName };
  }

  protected getApiInterfaceFileContent(ctx: Context, args: Args.GetApiinterfaceFileContent): AppendValueGroup<Builder> {
    const { interfaceName } = args;

    return appendValueGroup([this.getApiInterface(ctx, { interfaceName })], '\n');
  }

  protected getApiInterface(ctx: Context, args: Args.GetApiInterface): kt.Interface<Builder> {
    const { interfaceName } = args;

    return kt.interface(interfaceName, {
      annotations: this.getApiInterfaceAnnotations(ctx),
      members: this.getApiInterfaceMembers(ctx),
    });
  }

  private getApiInterfaceAnnotations(ctx: Context): kt.Annotation<Builder>[] {
    const validated = kt.annotation(kt.refs.spring.validated());
    const requestMapping = kt.annotation(kt.refs.spring.requestMapping(), [
      kt.argument(this.getControllerRequestMapping(ctx, { prefix: 'api' })),
    ]);
    return [validated, requestMapping];
  }

  private getApiInterfaceMembers(ctx: Context): kt.InterfaceMember<Builder>[] {
    const members: kt.InterfaceMember<Builder>[] = [];
    const delegateInterfaceName = this.getApiDelegateInterfaceName(ctx, {});

    members.push(
      kt.function('getDelegate', {
        returnType: delegateInterfaceName,
        singleExpression: true,
        body: kt.object({
          implements: [delegateInterfaceName],
        }),
      }),
    );

    ctx.service.endpoints.forEach((endpoint) => {
      members.push(this.getApiInterfaceEndpointMethod(ctx, { endpoint }));
    });

    return members;
  }

  protected getApiInterfaceEndpointMethod(
    ctx: Context,
    args: Args.GetApiInterfaceEndpointMethod,
  ): kt.Function<Builder> {
    const { endpoint } = args;
    const parameters = this.getAllParameters(ctx, { endpoint });

    return kt.function(toCasing(endpoint.name, ctx.config.functionNameCasing), {
      suspend: true,
      annotations: this.getApiInterfaceEndpointMethodAnnnotations(ctx, endpoint),
      parameters: parameters.map((parameter) => this.getApiInterfaceEndpointMethodParameter(ctx, endpoint, parameter)),
      returnType: kt.refs.spring.responseEntity([this.getResponseType(ctx, { endpoint })]),
      body: this.getApiInterfaceEndpointMethodBody(ctx, endpoint, parameters),
    });
  }

  private getApiInterfaceEndpointMethodAnnnotations(ctx: Context, endpoint: ApiEndpoint): kt.Annotation<Builder>[] {
    const annotations: kt.Annotation<Builder>[] = [];

    if (ctx.config.addSwaggerAnnotations) {
      annotations.push(
        kt.annotation(kt.refs.swagger.operation(), [
          endpoint.summary ? kt.argument.named('summary', kt.string(endpoint.summary?.trim())) : null,
          kt.argument.named('operationId', kt.string(endpoint.name)),
          endpoint.description ? kt.argument.named('description', kt.string(endpoint.description?.trim())) : null,
          endpoint.deprecated !== undefined ? kt.argument.named('deprecated', kt.toNode(endpoint.deprecated)) : null,
        ]),
      );

      if (endpoint.responses.length > 0) {
        annotations.push(
          kt.annotation(kt.refs.swagger.apiResponses(), [
            kt.argument.named(
              'value',
              kt.collectionLiteral(
                endpoint.responses.map((response) =>
                  kt.call(kt.refs.swagger.apiResponse(), [
                    kt.argument.named('responseCode', kt.string(response.statusCode?.toString())),
                    response.description
                      ? kt.argument.named('description', kt.string(response.description?.trim()))
                      : null,
                  ])
                ),
              ),
            ),
          ]),
        );
      }
    }

    const requestMapping = kt.annotation(kt.refs.spring.requestMapping(), [
      kt.argument.named(
        'method',
        kt.collectionLiteral([kt.call([kt.refs.spring.requestMethod(), endpoint.method.toUpperCase()])]),
      ),
      kt.argument.named('value', kt.collectionLiteral([kt.string(this.getEndpointPath(ctx, { endpoint }))])),
    ]);
    if (endpoint.requestBody && endpoint.requestBody.content.length > 0) {
      requestMapping.arguments.push(
        kt.argument.named(
          'consumes',
          kt.collectionLiteral(endpoint.requestBody?.content.map((x) => kt.string(x.type))),
        ),
      );
    }
    annotations.push(requestMapping);

    return annotations;
  }

  private getApiInterfaceEndpointMethodParameter(
    ctx: Context,
    endpoint: ApiEndpoint,
    parameter: ApiParameterWithMultipartInfo,
  ): kt.Parameter<Builder> {
    const schemaType = this.getSchemaType(ctx, { schema: parameter.schema });
    const result = kt.parameter(
      toCasing(parameter.name, ctx.config.parameterNameCasing),
      this.getParameterType(ctx, { endpoint, parameter }),
      {
        default: parameter.multipart && parameter.schema?.default !== undefined
          ? kt.toNode(parameter.schema?.default)
          : null,
      },
    );

    if (ctx.config.addSwaggerAnnotations) {
      const annotation = kt.annotation(kt.refs.swagger.parameter(), [
        parameter.multipart ? kt.argument.named('name', kt.string(parameter.multipart.name)) : null,
        parameter.description ? kt.argument.named('description', kt.string(parameter.description?.trim())) : null,
        kt.argument.named('required', parameter.required),
      ]);
      if (parameter.schema?.default !== undefined) {
        annotation.arguments.push(
          kt.argument.named(
            'schema',
            kt.call(
              [kt.refs.swagger.schema()],
              [kt.argument.named('defaultValue', kt.string(String(parameter.schema?.default)))],
            ),
          ),
        );
      }
      result.annotations.push(annotation);
    }

    const isCorePackage = !schemaType?.packageName || /^(kotlin|java)(\..*|$)/.test(schemaType.packageName);
    if (!isCorePackage && ctx.config.addJakartaValidationAnnotations) {
      result.annotations.push(kt.annotation(kt.refs.jakarta.valid()));
    }

    if (parameter.target === 'body' && !parameter.multipart) {
      result.annotations.push(kt.annotation(kt.refs.spring.requestBody()));
    }

    if (parameter.target === 'query') {
      const annotation = kt.annotation(kt.refs.spring.requestParam(), [
        kt.argument.named('value', kt.string(parameter.name)),
        kt.argument.named('required', parameter.required),
      ]);
      if (parameter.schema?.default !== undefined) {
        annotation.arguments.push(kt.argument.named('defaultValue', kt.string(String(parameter.schema?.default))));
      }
      result.annotations.push(annotation);
    }

    if (parameter.target === 'path') {
      result.annotations.push(kt.annotation(kt.refs.spring.pathVariable(), [kt.string(parameter.name)]));
    }

    if (parameter.multipart) {
      result.annotations.push(
        kt.annotation(kt.refs.spring.requestPart(), [
          kt.argument.named('value', kt.string(parameter.multipart.name)),
          kt.argument.named('required', parameter.required),
        ]),
      );
    }

    return result;
  }

  private getApiInterfaceEndpointMethodBody(
    ctx: Context,
    endpoint: ApiEndpoint,
    parameters: ApiParameter[],
  ): AppendValueGroup<Builder> {
    return appendValueGroup(
      [
        s`return ${
          kt.call(
            [kt.call(kt.reference('getDelegate'), []), toCasing(endpoint.name, ctx.config.functionNameCasing)],
            parameters.map((x) => toCasing(x.name, ctx.config.parameterNameCasing)),
          )
        }`,
      ],
      '\n',
    );
  }
  // #endregion

  // #region API Controller
  protected generateApiControllerFile(ctx: Context, args: Args.GenerateApiControllerFile): KotlinImport {
    const { dirPath, packageName } = args;
    const typeName = this.getApiControllerName(ctx, {});
    const fileName = `${typeName}.kt`;
    const filePath = `${dirPath}/${fileName}`;
    console.log(`  Generating API controller ${typeName} to ${fileName}...`);

    const builder = new KotlinFileBuilder(packageName, ctx.config);
    builder.append(this.getApiControllerFileContent(ctx, { controllerName: typeName }));
    fs.writeFileSync(filePath, builder.toString());

    return { typeName, packageName };
  }

  protected getApiControllerFileContent(
    ctx: Context,
    args: Args.GetApiControllerFileContent,
  ): AppendValueGroup<Builder> {
    const { controllerName } = args;

    return appendValueGroup([this.getApiController(ctx, { controllerName })], '\n');
  }

  protected getApiController(ctx: Context, args: Args.GetApiController): kt.Class<Builder> {
    const { controllerName } = args;

    return kt.class(controllerName, {
      annotations: this.getApiControllerAnnotations(ctx),
      primaryConstructor: kt.constructor([
        kt.parameter.class(
          'delegate',
          kt.reference(this.getApiDelegateInterfaceName(ctx, {}), null, { nullable: true }),
          {
            annotations: [kt.annotation(kt.refs.spring.autowired(), [kt.argument.named('required', 'false')])],
          },
        ),
      ]),
      implements: [this.getApiInterfaceName(ctx, {})],
      members: this.getApiControllerMembers(ctx),
    });
  }

  private getApiControllerAnnotations(ctx: Context): kt.Annotation<Builder>[] {
    const annotations: kt.Annotation<Builder>[] = [];
    if (ctx.config.addJakartaValidationAnnotations) {
      annotations.push(
        kt.annotation(kt.refs.jakarta.generated(), [
          kt.argument.named('value', kt.collectionLiteral([kt.string('com.goast.kotlin.spring-service-generator')])),
        ]),
      );
    }
    annotations.push(kt.annotation(kt.refs.spring.controller()));
    annotations.push(kt.annotation(kt.refs.spring.requestMapping(), [this.getControllerRequestMapping(ctx, {})]));
    return annotations;
  }

  private getApiControllerMembers(ctx: Context): kt.ClassMember<Builder>[] {
    const delegateInterfaceName = this.getApiDelegateInterfaceName(ctx, {});

    const delegateProp = kt.property<Builder>('delegate', {
      accessModifier: 'private',
      type: kt.reference(delegateInterfaceName),
    });

    const initBlock = kt.initBlock<Builder>(
      appendValueGroup(
        [
          s`this.delegate = ${kt.refs.java.optional.infer()}.ofNullable(delegate).orElse(object : ${delegateInterfaceName} {})`,
        ],
        '\n',
      ),
    );

    const getDelegateFun = kt.function<Builder>('getDelegate', {
      override: true,
      returnType: delegateInterfaceName,
      singleExpression: true,
      body: kt.reference('delegate'),
    });

    return [delegateProp, initBlock, getDelegateFun];
  }
  // #endregion

  // #region API Delegate Interface
  protected generateApiDelegateInterfaceFile(ctx: Context, args: Args.GenerateApiDelegateInterfaceFile): KotlinImport {
    const { dirPath, packageName } = args;
    const typeName = this.getApiDelegateInterfaceName(ctx, {});
    const fileName = `${typeName}.kt`;
    const filePath = `${dirPath}/${fileName}`;
    console.log(`  Generating API delegate ${typeName} to ${fileName}...`);

    const builder = new KotlinFileBuilder(packageName, ctx.config);
    builder.append(this.getApiDelegateInterfaceFileContent(ctx, { delegateInterfaceName: typeName }));
    fs.writeFileSync(filePath, builder.toString());

    return { typeName, packageName };
  }

  protected getApiDelegateInterfaceFileContent(
    ctx: Context,
    args: Args.GetApiDelegateInterfaceFileContent,
  ): AppendValueGroup<Builder> {
    const { delegateInterfaceName } = args;

    return appendValueGroup([this.getApiDelegateInterface(ctx, { delegateInterfaceName })], '\n');
  }

  protected getApiDelegateInterface(ctx: Context, args: Args.GetApiDelegateInterface): kt.Interface<Builder> {
    const { delegateInterfaceName } = args;

    return kt.interface(delegateInterfaceName, {
      annotations: this.getApiDelegateInterfaceAnnotations(ctx),
      members: this.getApiDelegateInterfaceMembers(ctx),
    });
  }

  private getApiDelegateInterfaceAnnotations(ctx: Context): kt.Annotation<Builder>[] {
    const annotations: kt.Annotation<Builder>[] = [];
    if (ctx.config.addJakartaValidationAnnotations) {
      annotations.push(
        kt.annotation(kt.refs.jakarta.generated(), [
          kt.argument.named('value', kt.collectionLiteral([kt.string('com.goast.kotlin.spring-service-generator')])),
        ]),
      );
    }
    return annotations;
  }

  private getApiDelegateInterfaceMembers(ctx: Context): kt.InterfaceMember<Builder>[] {
    const members: kt.InterfaceMember<Builder>[] = [];

    members.push(
      kt.function('getRequest', {
        returnType: kt.refs.java.optional([kt.refs.spring.nativeWebRequest()]),
        singleExpression: true,
        body: kt.call([kt.refs.java.optional.infer(), 'empty'], []),
      }),
    );

    ctx.service.endpoints.forEach((endpoint) => {
      members.push(this.getApiDelegateInterfaceEndpointMethod(ctx, { endpoint }));
    });

    return members;
  }

  protected getApiDelegateInterfaceEndpointMethod(
    ctx: Context,
    args: Args.GetApiDelegateInterfaceEndpointMethod,
  ): kt.Function<Builder> {
    const { endpoint } = args;
    const parameters = this.getAllParameters(ctx, { endpoint });

    return kt.function(toCasing(endpoint.name, ctx.config.functionNameCasing), {
      suspend: true,
      parameters: parameters.map((parameter) => {
        return kt.parameter(
          toCasing(parameter.name, ctx.config.parameterNameCasing),
          this.getParameterType(ctx, { endpoint, parameter }),
        );
      }),
      returnType: kt.refs.spring.responseEntity([this.getResponseType(ctx, { endpoint })]),
      body: appendValueGroup(
        [s`return ${kt.refs.spring.responseEntity.infer()}(${kt.refs.spring.httpStatus()}.NOT_IMPLEMENTED)`],
        '\n',
      ),
    });
  }
  // #endregion

  protected getParameterType(ctx: Context, args: Args.GetParameterType): kt.Type<Builder> {
    const { parameter } = args;
    if (parameter.multipart?.isFile) {
      return kt.refs.spring.filePart();
    }
    const type = this.getTypeUsage(ctx, {
      schema: parameter.schema,
      nullable: (!parameter.required && parameter.schema?.default === undefined) || undefined,
    });
    return parameter.target === 'body' ? listToFlux(type) : type;
  }

  protected getResponseType(ctx: Context, args: Args.GetResponseType): kt.Type<Builder> {
    const { endpoint } = args;
    const responseSchemas = endpoint.responses
      .flatMap((x) => x.contentOptions.flatMap((x) => x.schema))
      .filter(notNullish)
      .filter(
        (x, i, a) =>
          a.findIndex((y) => {
            const xType = this.getSchemaType(ctx, { schema: x });
            const yType = this.getSchemaType(ctx, { schema: y });
            return xType?.name === yType?.name && xType?.packageName === yType?.packageName;
          }) === i,
      );

    if (responseSchemas.length === 1) {
      return listToFlux(this.getTypeUsage(ctx, { schema: responseSchemas[0], fallback: kt.refs.unit() }));
    } else if (responseSchemas.length === 0) {
      return kt.refs.unit();
    } else {
      return kt.refs.any({ nullable: true });
    }
  }

  protected getTypeUsage(ctx: Context, args: Args.GetTypeUsage<Builder>): kt.Type<Builder> {
    const { schema, nullable, fallback } = args;
    const type = this.getSchemaType(ctx, { schema });
    return type
      ? createOverwriteProxy(type, { nullable: nullable ?? type.nullable })
      : (fallback ?? kt.refs.any({ nullable }));
  }

  protected getSchemaType(ctx: Context, args: Args.GetSchemaType): kt.Reference<SourceBuilder> | undefined {
    const { schema } = args;
    return schema && ctx.input.kotlin.models[schema.id].type;
  }

  protected getControllerRequestMapping(ctx: Context, args: Args.GetControllerRequestMapping): kt.String<Builder> {
    let { prefix } = args;
    const basePath = this.getBasePath(ctx, {});
    prefix ??= `openapi.${toCasing(ctx.service.name, ctx.config.propertyNameCasing)}`;
    return kt.string(`\${${prefix}.base-path:${basePath}}`);
  }

  protected getBasePath(ctx: Context, _args: Args.GetBasePath): string {
    return modifyString(
      (ctx.service.$src ?? ctx.service.endpoints[0]?.$src)?.document.servers?.[0]?.url ?? '/',
      ctx.config.basePath,
      ctx.service,
    );
  }

  protected getEndpointPath(ctx: Context, args: Args.GetEndpointPath): string {
    const { endpoint } = args;
    return modifyString(endpoint.path, ctx.config.pathModifier, endpoint);
  }

  protected getDirectoryPath(ctx: Context, args: Args.GetDirectoryPath): string {
    const { packageName } = args;
    return `${ctx.config.outputDir}/${packageName.replace(/\./g, '/')}`;
  }

  protected getPackageName(ctx: Context, _args: Args.GetPackageName): string {
    const packageSuffix = typeof ctx.config.packageSuffix === 'string'
      ? ctx.config.packageSuffix
      : ctx.config.packageSuffix(ctx.service);
    return ctx.config.packageName + packageSuffix;
  }

  protected getApiInterfaceName(ctx: Context, _args: Args.GetApiInterfaceName): string {
    return toCasing(ctx.service.name + '_Api', ctx.config.typeNameCasing);
  }

  protected getApiControllerName(ctx: Context, _args: Args.GetApiControllerName): string {
    return toCasing(ctx.service.name + '_ApiController', ctx.config.typeNameCasing);
  }

  protected getApiDelegateInterfaceName(ctx: Context, _args: Args.GetApiDelegateInterfaceName): string {
    return toCasing(ctx.service.name + '_ApiDelegate', ctx.config.typeNameCasing);
  }

  protected getAllParameters(ctx: Context, args: Args.GetAllParameters): ApiParameterWithMultipartInfo[] {
    const { endpoint } = args;
    const parameters = endpoint.parameters.filter(
      (parameter) => parameter.target === 'query' || parameter.target === 'path',
    );
    if (endpoint.requestBody) {
      const content = endpoint.requestBody.content[0];
      let schema = content.schema;

      if (content.type === 'multipart/form-data') {
        if (schema && schema.kind === 'object') {
          schema = resolveAnyOfAndAllOf(schema, true) ?? schema;
          const properties = schema.properties ?? {};
          for (const [name, property] of properties.entries()) {
            parameters.push(
              Object.assign(
                this.createApiParameter({
                  id: `multipart-${name}`,
                  name,
                  target: 'body',
                  schema: property.schema,
                  required: schema.required.has(name),
                  description: property.schema.description,
                }),
                {
                  multipart: {
                    name,
                    isFile: property.schema.kind === 'string' && property.schema.format === 'binary',
                  },
                },
              ),
            );
          }
        }
      } else {
        const schemaType = this.getSchemaType(ctx, { schema });
        const name = !schemaType || /^Any\??$/.test(schemaType.name)
          ? 'body'
          : SourceBuilder.build((b) => kt.reference.write(b, schemaType));
        parameters.push(
          this.createApiParameter({
            id: 'body',
            name,
            target: 'body',
            schema,
            required: endpoint.requestBody.required,
            description: endpoint.requestBody.description,
          }),
        );
      }
    }

    return parameters;
  }

  private createApiParameter(data: Partial<ApiParameter> & Pick<ApiParameter, 'id' | 'name' | 'target'>): ApiParameter {
    return {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      $src: undefined!,
      $ref: undefined,
      schema: undefined,
      required: false,
      description: undefined,
      allowEmptyValue: undefined,
      allowReserved: undefined,
      deprecated: false,
      explode: undefined,
      style: undefined,
      ...data,
    };
  }
}

export function listToFlux<T>(type: T): T {
  return kt.refs.list.matches(type) ? (kt.refs.reactor.flux([type.generics[0]]) as T) : type;
}
