import {
  type AppendValue,
  type AppendValueGroup,
  appendValueGroup,
  builderTemplate as s,
  getSourceDisplayName,
  type MaybePromise,
  notNullish,
  toCasing,
} from '@goast/core';

import { cs } from '../../../ast/index.ts';
import { CSharpFileBuilder } from '../../../file-builder.ts';
import { toCSharpStringLiteral } from '../../../utils.ts';
import { CSharpFileGenerator } from '../../file-generator.ts';
import {
  appendParameterConversion,
  buildApiJsonSupportClass,
  buildApiRequestExceptionClass,
  buildApiRequestSupportClass,
  buildApiResponseSupportClass,
  buildResponseWrapperClass,
  buildStrictResult,
  getBasePath,
  getEndpointDocDescription,
  getEndpointParameters,
  getEndpointPath,
  getHandlerMethod,
  getHandlerMethodName,
  getResultArm,
  getResultSwitch,
  getServerNamespace,
  type SupportClass,
  toIdentifier,
  toRouteTemplate,
  UniqueNames,
  withNullable,
} from '../shared/index.ts';
import type { DefaultCSharpMinimalApiGeneratorArgs as Args } from './index.ts';
import type {
  CSharpMinimalApiGeneratorContext,
  CSharpMinimalApiGeneratorOutput,
  CSharpMinimalApisGeneratorContext,
} from './models.ts';

type Context = CSharpMinimalApiGeneratorContext;
type Output = CSharpMinimalApiGeneratorOutput;
type Builder = CSharpFileBuilder;

/** The name of the generated `IResult` the endpoint methods return. */
const httpResultName = 'ApiHttpResult';

/** The members `object` declares: a handler of the same name would hide them. */
const objectMembers = ['Equals', 'Finalize', 'GetHashCode', 'GetType', 'MemberwiseClone', 'ToString'];

const aspNetCore = cs.refs.aspNetCore;

const mapMethods: Record<string, string> = {
  get: 'MapGet',
  post: 'MapPost',
  put: 'MapPut',
  patch: 'MapPatch',
  delete: 'MapDelete',
};

export interface CSharpMinimalApiGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): MaybePromise<TOutput>;
  generateSupportFiles(ctx: CSharpMinimalApisGeneratorContext): MaybePromise<void>;
}

/**
 * Generates the Minimal API code of a service.
 *
 * Every endpoint method returns a plain `IResult` (an `ApiHttpResult` that writes the response through
 * `ApiResponseSupport`) rather than a typed `Results<...>` union: the strict result types allow headers, several
 * content types and `default`/range statuses and serialize polymorphic bodies through their base type, none of which
 * `TypedResults` can express without changing what is written to the wire. The OpenAPI metadata a typed result would
 * have provided is declared on the route instead (`Produces`/`Accepts`) for every response that has an exact status
 * code; `default` and range responses cannot be declared.
 */
export class DefaultCSharpMinimalApiGenerator
  extends CSharpFileGenerator<Context, Output>
  implements CSharpMinimalApiGenerator
{
  public generate(ctx: Context): MaybePromise<Output> {
    const namespace = this.getNamespace(ctx, {});
    const dirPath = this.getDirectoryPath(ctx, {});
    const supportNamespace = this.getSupportNamespace(ctx, {});
    const apiName = this.getApiName(ctx, {});
    const extensionsName = this.getExtensionsName(ctx, {});
    const mapMethodName = this.getMapMethodName(ctx, {});

    console.log(`Generating service ${ctx.service.id} to ${dirPath}...`);
    console.log(`  Endpoints:`);
    ctx.service.endpoints.forEach((endpoint) => {
      console.log(`  - ${getSourceDisplayName(ctx.data, endpoint)}`);
    });

    const handlerNames = new UniqueNames(objectMembers);
    const methodNames = new UniqueNames([mapMethodName]);
    const endpoints = ctx.service.endpoints.map((endpoint) => {
      const methodBase = toIdentifier(toCasing(`${endpoint.name}_Endpoint`, ctx.config.methodNameCasing), 'Endpoint');
      return {
        endpoint,
        plans: getEndpointParameters(ctx, endpoint, { supportNamespace }),
        result: buildStrictResult(ctx, endpoint, { namespace }),
        handlerName: handlerNames.next(getHandlerMethodName(ctx, endpoint)),
        methodName: methodNames.next(methodBase),
      } satisfies Args.EndpointInfo;
    });

    const results: Output['results'] = {};
    for (const info of endpoints) {
      // An endpoint with several tags is part of several services but has one result type, so one file.
      const isGenerated = Object.values(ctx.output.csharp.minimalApis).some((x) => info.endpoint.id in x.results);
      if (!isGenerated) this.generateResultFile(ctx, { info, dirPath, namespace });
      results[info.endpoint.id] = info.result.reference;
    }

    this.generateApiFile(ctx, { dirPath, namespace, apiName, endpoints });
    this.generateExtensionsFile(ctx, { dirPath, namespace, apiName, extensionsName, endpoints });

    return {
      api: cs.reference(apiName, namespace),
      extensions: cs.reference(extensionsName, namespace),
      results,
    };
  }

  // #region Support files
  public generateSupportFiles(ctx: CSharpMinimalApisGeneratorContext, _args: Args.GenerateSupportFiles = {}): void {
    const namespace = getServerNamespace(ctx, null);
    const dirPath = `${ctx.config.outputDir}/${ctx.config.minimalApisDir}`;

    for (const support of this.getSupportClasses(ctx)) {
      this.generateSupportFile(ctx, support, namespace, dirPath);
    }
    this.generateSupportFile(ctx, this.getHttpResultClass(ctx), namespace, dirPath);
  }

  /** The support types shared by all APIs. */
  protected getSupportClasses(_ctx: CSharpMinimalApisGeneratorContext): SupportClass[] {
    return [
      buildApiJsonSupportClass(),
      buildApiRequestExceptionClass(),
      buildApiRequestSupportClass(),
      buildApiResponseSupportClass(),
    ];
  }

  protected generateSupportFile(
    ctx: CSharpMinimalApisGeneratorContext,
    support: SupportClass,
    namespace: string,
    dirPath: string,
  ): void {
    const filePath = `${dirPath}/${support.name}.cs`;
    console.log(`  Generating support type ${support.name} to ${filePath}...`);

    const builder = new CSharpFileBuilder(namespace, ctx.config);
    support.usings.forEach((x) => builder.addUsing(x));
    builder.append(support.declaration);
    builder.writeToFile(filePath);
  }

  /** The `IResult` that writes a response through `ApiResponseSupport`. */
  protected getHttpResultClass(_ctx: CSharpMinimalApisGeneratorContext): SupportClass {
    return buildResponseWrapperClass(httpResultName, {
      doc: 'A result that writes a response: status code, headers and a body.',
      implements: aspNetCore.http.iResult(),
      execute: s<Builder>`
        /// <inheritdoc />
        public ${cs.refs.system.task()} ExecuteAsync(${aspNetCore.http.httpContext()} httpContext)
        {
            return ApiResponseSupport.WriteAsync(httpContext.Response, statusCode, contentType, body, headers, httpContext.RequestAborted);
        }
      `,
    });
  }
  // #endregion

  // #region Result files
  protected generateResultFile(ctx: Context, args: Args.GenerateResultFile): void {
    const { info, dirPath, namespace } = args;
    const filePath = `${dirPath}/${info.result.name}.cs`;
    console.log(`  Generating result ${info.result.name} to ${filePath}...`);

    const builder = new CSharpFileBuilder(namespace, ctx.config);
    builder.append(this.getResultFileContent(ctx, { result: info.result }));
    builder.writeToFile(filePath);
  }

  protected getResultFileContent(_ctx: Context, args: Args.GetResultFileContent): AppendValueGroup<Builder> {
    return appendValueGroup<Builder>(
      [
        // Referencing an `[Obsolete]` model is a warning (an error under `TreatWarningsAsErrors`).
        '#pragma warning disable CS0612, CS0618',
        args.result.record,
      ],
      '\n',
    );
  }
  // #endregion

  // #region API base file
  protected generateApiFile(ctx: Context, args: Args.GenerateApiFile): void {
    const { dirPath, namespace, apiName, endpoints } = args;
    const filePath = `${dirPath}/${apiName}.cs`;
    console.log(`  Generating API ${apiName} to ${filePath}...`);

    const builder = new CSharpFileBuilder(namespace, ctx.config);
    builder.append(this.getApiFileContent(ctx, { apiName, endpoints }));
    builder.writeToFile(filePath);
  }

  protected getApiFileContent(ctx: Context, args: Args.GetApiFileContent): AppendValueGroup<Builder> {
    return appendValueGroup<Builder>(['#pragma warning disable CS0612, CS0618', this.getApi(ctx, args)], '\n');
  }

  protected getApi(ctx: Context, args: Args.GetApi): cs.Class<Builder> {
    const { apiName, endpoints } = args;
    return cs.class<Builder>(apiName, {
      doc: cs.doc(
        ctx.service.description?.trim() ||
          `The base class of the ${ctx.service.name} API. Derive from it, implement the abstract handler methods and register the implementation as ${apiName} in the service collection.`,
      ),
      accessModifier: 'public',
      abstract: true,
      members: endpoints.map((info) => this.getHandlerMethod(ctx, { info })),
    });
  }

  protected getHandlerMethod(ctx: Context, args: Args.GetHandlerMethod): cs.Method<Builder> {
    const { info } = args;
    return getHandlerMethod(info.handlerName, info.plans, info.result.reference, {
      doc: getEndpointDocDescription(ctx, info.endpoint) || `Handles the ${info.endpoint.name} operation.`,
      accessModifier: 'public',
    });
  }
  // #endregion

  // #region Extensions file
  protected generateExtensionsFile(ctx: Context, args: Args.GenerateExtensionsFile): void {
    const { dirPath, namespace, apiName, extensionsName, endpoints } = args;
    const filePath = `${dirPath}/${extensionsName}.cs`;
    console.log(`  Generating route mapping ${extensionsName} to ${filePath}...`);

    const builder = new CSharpFileBuilder(namespace, ctx.config);
    builder.append(this.getExtensionsFileContent(ctx, { apiName, extensionsName, endpoints }));
    builder.writeToFile(filePath);
  }

  protected getExtensionsFileContent(ctx: Context, args: Args.GetExtensionsFileContent): AppendValueGroup<Builder> {
    return appendValueGroup<Builder>(['#pragma warning disable CS0612, CS0618', this.getExtensions(ctx, args)], '\n');
  }

  protected getExtensions(ctx: Context, args: Args.GetExtensions): cs.Class<Builder> {
    const { apiName, extensionsName, endpoints } = args;
    return cs.class<Builder>(extensionsName, {
      doc: cs.doc(`Maps the routes of the ${ctx.service.name} API.`),
      accessModifier: 'public',
      static: true,
      members: [
        this.getMapMethod(ctx, { apiName, endpoints }),
        ...endpoints.map((info) => this.getEndpointMethod(ctx, { apiName, info })),
      ],
    });
  }

  protected getMapMethod(ctx: Context, args: Args.GetMapMethod): cs.Method<Builder> {
    const { apiName, endpoints } = args;
    return cs.method<Builder>(this.getMapMethodName(ctx, {}), {
      doc: cs.doc(
        `Maps every route of the ${ctx.service.name} API to the ${apiName} registered in the service collection.`,
      ),
      accessModifier: 'public',
      static: true,
      returnType: aspNetCore.routing.routeGroupBuilder(),
      parameters: [cs.parameter<Builder>('app', aspNetCore.routing.iEndpointRouteBuilder(), { this: true })],
      body: this.getMapMethodBody(ctx, { endpoints }),
    });
  }

  protected getMapMethodBody(ctx: Context, args: Args.GetMapMethodBody): AppendValue<Builder> {
    const { endpoints } = args;
    const basePath = getBasePath(ctx, ctx.service);
    const group = 'group';

    return (b: Builder) => {
      // The mapping and metadata calls are extension methods the file has to import.
      b.addUsing('Microsoft.AspNetCore.Builder');
      b.addUsing('Microsoft.AspNetCore.Http');

      b.appendLine(s<Builder>`var ${group} = app.MapGroup(${cs.string<Builder>(toRouteTemplate(basePath))});`);
      for (const info of endpoints) {
        b.appendLine().append(this.getRouteMapping(ctx, { info, group }));
      }
      b.appendLine().appendLine(`return ${group};`);
    };
  }

  /** The statement that maps one route to its endpoint method, with its metadata. */
  protected getRouteMapping(ctx: Context, args: Args.GetRouteMapping): AppendValue<Builder> {
    const { info, group } = args;
    const path = cs.string<Builder>(toRouteTemplate(getEndpointPath(ctx, info.endpoint)));
    const method = info.endpoint.method;
    const verb = mapMethods[method];
    const mapping = verb
      ? s<Builder>`${group}.${verb}(${path}, ${info.methodName})`
      : s<Builder>`${group}.MapMethods(${path}, new[] { ${cs.string<Builder>(method.toUpperCase())} }, ${info.methodName})`;
    const metadata = this.getMetadataCalls(ctx, { info });

    return (b: Builder) => {
      b.append(mapping);
      if (metadata.length === 0) {
        b.appendLine(';');
        return;
      }
      b.appendLine();
      b.indent((b) => {
        metadata.forEach((call, i) => b.append(call).appendLine(i === metadata.length - 1 ? ';' : ''));
      });
    };
  }

  /** The metadata calls chained to a route, each a line of its own. */
  protected getMetadataCalls(ctx: Context, args: Args.GetMetadataCalls): AppendValue<Builder>[] {
    const { info } = args;
    return [
      s<Builder>`.WithName(${cs.string<Builder>(info.endpoint.name)})`,
      s<Builder>`.WithTags(${cs.string<Builder>(ctx.service.name)})`,
      this.getAcceptsCall(ctx, { info }),
      ...info.result.cases.map((resultCase) => this.getProducesCall(ctx, { resultCase })),
      // The generated code reads forms through the framework's binding, which would demand an anti-forgery token.
      info.plans.some((plan) => plan.source === 'form') ? '.DisableAntiforgery()' : null,
    ].filter(notNullish);
  }

  /** `Accepts`, for a body the endpoint method reads itself (the framework infers it for bound form parts). */
  protected getAcceptsCall(_ctx: Context, args: Args.GetAcceptsCall): AppendValue<Builder> | null {
    const { info } = args;
    const body = info.plans.find((plan) => plan.source === 'body');
    const contentTypes = [...new Set(info.endpoint.requestBody?.content.map((x) => x.type) ?? [])].filter(
      (x) => !x.includes('*'),
    );
    if (!body || contentTypes.length === 0) return null;
    const optional = body.required ? '' : 'true, ';
    return s<Builder>`.Accepts<${withNullable(body.type, false)}>(${optional}${contentTypes.map((x) => toCSharpStringLiteral(x)).join(', ')})`;
  }

  /** `Produces`, for a response with an exact status code. `default` and range responses cannot be declared. */
  protected getProducesCall(_ctx: Context, args: Args.GetProducesCall): AppendValue<Builder> | null {
    const { resultCase: c } = args;
    if (c.isDefault || c.statusCode === undefined) return null;
    const contentTypes = c.contentTypes.map((x) => toCSharpStringLiteral(x));
    const bodyType =
      c.bodyType && c.bodyType.name !== 'object' && c.bodyType.name !== 'Stream'
        ? withNullable(c.bodyType, false)
        : undefined;
    if (bodyType) return s<Builder>`.Produces<${bodyType}>(${[String(c.statusCode), ...contentTypes].join(', ')})`;
    if (contentTypes.length > 0) return `.Produces(${[String(c.statusCode), 'null', ...contentTypes].join(', ')})`;
    return `.Produces(${c.statusCode})`;
  }
  // #endregion

  // #region Endpoint method
  protected getEndpointMethod(ctx: Context, args: Args.GetEndpointMethod): cs.Method<Builder> {
    const { apiName, info } = args;
    const used = new UniqueNames([
      'cancellationToken',
      ...info.plans.flatMap((plan) => [
        plan.name,
        plan.valueName,
        ...(plan.binding.kind === 'bound' ? [plan.binding.actionName] : []),
      ]),
    ]);
    const apiParameter = used.next('api');
    const requestParameter = used.next('request');
    const needsRequest = info.plans.some((plan) => plan.binding.kind === 'request');

    return cs.method<Builder>(info.methodName, {
      doc: cs.doc(getEndpointDocDescription(ctx, info.endpoint) || `Handles the ${info.endpoint.name} operation.`),
      accessModifier: 'private',
      static: true,
      async: true,
      returnType: cs.refs.system.taskOf([aspNetCore.http.iResult()]),
      parameters: [
        cs.parameter<Builder>(apiParameter, cs.reference(apiName, this.getNamespace(ctx, {})), {
          attributes: [cs.attribute(cs.refs.aspNetCore.mvc.fromServices())],
        }),
        ...info.plans.map((plan) => this.getEndpointParameter(ctx, { info, plan })).filter(notNullish),
        needsRequest ? cs.parameter<Builder>(requestParameter, aspNetCore.http.httpRequest()) : null,
        cs.parameter<Builder>('cancellationToken', cs.refs.system.cancellationToken()),
      ],
      body: this.getEndpointMethodBody(ctx, { info, apiParameter, requestParameter }),
    });
  }

  protected getEndpointParameter(ctx: Context, args: Args.GetEndpointParameter): cs.Parameter<Builder> | null {
    const { plan } = args;
    if (plan.binding.kind !== 'bound') return null;
    return cs.parameter<Builder>(plan.binding.actionName, plan.binding.actionType, {
      attributes: [this.getBindingAttribute(ctx, { plan })],
    });
  }

  /** The attribute that tells the framework where to find the value, always with the name on the wire. */
  protected getBindingAttribute(_ctx: Context, args: Args.GetBindingAttribute): cs.Attribute<Builder> {
    const { plan } = args;
    const factory = {
      path: cs.refs.aspNetCore.mvc.fromRoute,
      query: cs.refs.aspNetCore.mvc.fromQuery,
      header: cs.refs.aspNetCore.mvc.fromHeader,
      cookie: cs.refs.aspNetCore.mvc.fromQuery,
      body: cs.refs.aspNetCore.mvc.fromBody,
      form: cs.refs.aspNetCore.mvc.fromForm,
    }[plan.source];
    return cs.attribute(factory(), [], { properties: { Name: cs.string(plan.wireName) } });
  }

  protected getEndpointMethodBody(ctx: Context, args: Args.GetEndpointMethodBody): AppendValue<Builder> {
    const { info, apiParameter, requestParameter } = args;
    const supportNamespace = this.getSupportNamespace(ctx, {});
    const exceptionRef = cs.reference<Builder>('ApiRequestException', supportNamespace);

    const used = new UniqueNames([
      'cancellationToken',
      apiParameter,
      requestParameter,
      ...info.plans.flatMap((plan) => [plan.name, plan.valueName]),
    ]);
    const resultVariable = used.next('result');
    const exceptionVariable = used.next('requestException');

    const handlerCall = cs.call<Builder>(
      [apiParameter, info.handlerName],
      [...info.plans.map((plan) => plan.valueName), 'cancellationToken'],
      { await: true },
    );

    return (b: Builder) => {
      appendParameterConversion(b, info.plans, {
        request: requestParameter,
        cancellationToken: 'cancellationToken',
        exception: exceptionRef,
        exceptionVariable,
        onException: (variable) =>
          s<Builder>`return ${aspNetCore.http.results()}.Text(${variable}.Message, statusCode: ${variable}.StatusCode);`,
      });

      b.appendLine(s<Builder>`var ${resultVariable} = ${handlerCall};`);
      b.appendLine();
      b.append('return ')
        .append(this.getResultSwitch(ctx, { info, variable: resultVariable }))
        .appendLine(';');
    };
  }

  /** The exhaustive conversion of the result to an `IResult`: one arm per documented response. */
  protected getResultSwitch(ctx: Context, args: Args.GetResultSwitch): cs.SwitchExpression<Builder> {
    const { info, variable } = args;
    return getResultSwitch(info.result, variable, info.plans, this.getHttpResultReference(ctx));
  }

  protected getResultArm(ctx: Context, args: Args.GetResultArm): ReturnType<typeof cs.switchExpression.arm<Builder>> {
    return getResultArm(args.resultCase, args.variable, this.getHttpResultReference(ctx));
  }

  private getHttpResultReference(ctx: Context): cs.Reference<Builder> {
    return cs.reference<Builder>(httpResultName, this.getSupportNamespace(ctx, {}));
  }
  // #endregion

  // #region Names and locations
  protected getNamespace(ctx: Context, _args: Args.GetNamespace): string {
    return getServerNamespace(ctx, ctx.service);
  }

  /** The namespace of the support types, which is shared by all services. */
  protected getSupportNamespace(ctx: Context, _args: Args.GetSupportNamespace): string {
    return getServerNamespace(ctx, null);
  }

  protected getDirectoryPath(ctx: Context, _args: Args.GetDirectoryPath): string {
    return `${ctx.config.outputDir}/${ctx.config.minimalApisDir}`;
  }

  protected getApiName(ctx: Context, _args: Args.GetApiName): string {
    return toIdentifier(toCasing(`${ctx.service.name}_ApiBase`, ctx.config.typeNameCasing), 'ApiBase');
  }

  protected getExtensionsName(ctx: Context, _args: Args.GetExtensionsName): string {
    return toIdentifier(
      toCasing(`${ctx.service.name}_ApiEndpointRouteBuilderExtensions`, ctx.config.typeNameCasing),
      'ApiEndpointRouteBuilderExtensions',
    );
  }

  protected getMapMethodName(ctx: Context, _args: Args.GetMapMethodName): string {
    return toIdentifier(toCasing(`Map_${ctx.service.name}_Api`, ctx.config.methodNameCasing), 'MapApi');
  }
  // #endregion
}
