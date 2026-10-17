import {
  type AppendValue,
  type AppendValueGroup,
  appendValueGroup,
  builderTemplate as s,
  getSourceDisplayName,
  type MaybePromise,
  toCasing,
} from '@goast/core';

import { cs } from '../../../ast/index.ts';
import { CSharpFileBuilder } from '../../../file-builder.ts';
import { toCSharpStringLiteral } from '../../../utils.ts';
import { CSharpFileGenerator } from '../../file-generator.ts';
import {
  apiRequestExceptionName,
  apiRequestSupportName,
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
  getResultSwitch,
  getServerNamespace,
  type SupportClass,
  toIdentifier,
  UniqueNames,
} from '../shared/index.ts';
import type { DefaultCSharpFastEndpointGeneratorArgs as Args } from './index.ts';
import type {
  CSharpFastEndpointGeneratorContext,
  CSharpFastEndpointGeneratorOutput,
  CSharpFastEndpointsGeneratorContext,
} from './models.ts';
import { fastEndpointBaseMembers, fastEndpointRefs, fastEndpointVerbs } from './refs.ts';
import { buildApiEndpointSupportClass } from './support.ts';

type Context = CSharpFastEndpointGeneratorContext;
type Output = CSharpFastEndpointGeneratorOutput;
type Builder = CSharpFileBuilder;

/** The generated class that holds one response (status code, content type, body, headers) and writes it. */
const endpointResponseName = 'ApiEndpointResponse';

/** The generated static class that reads the raw values of a request that FastEndpoints is not asked to bind. */
const endpointSupportName = 'ApiEndpointSupport';

export interface CSharpFastEndpointGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): MaybePromise<TOutput>;
  generateSupportFiles(ctx: CSharpFastEndpointsGeneratorContext): MaybePromise<void>;
}

/**
 * Generates one abstract endpoint class per operation.
 *
 * The endpoint derives from `EndpointWithoutRequest` and there is no request DTO: FastEndpoints' own binding (JSON
 * body into the DTO, DTO validation, its 400 error format, its parsing of dates, enums and arrays) would change what
 * is accepted and what is answered on the wire. Instead `HandleAsync` reads the raw route, query, header, cookie,
 * form and body values from the `HttpContext` and converts them with the same `ApiRequestSupport` conversions the
 * controllers use, so the request handling follows the OpenAPI styles. The handler receives plain parameters, like
 * the handlers of the other server generators, and its strict result is written to the response with
 * `ApiResponseSupport`, which makes status, headers, content type and body bytes identical to the controllers'.
 */
export class DefaultCSharpFastEndpointGenerator
  extends CSharpFileGenerator<Context, Output>
  implements CSharpFastEndpointGenerator
{
  public generate(ctx: Context): MaybePromise<Output> {
    const namespace = this.getNamespace(ctx, {});
    const dirPath = this.getDirectoryPath(ctx, {});
    const supportNamespace = this.getSupportNamespace(ctx, {});

    console.log(`Generating service ${ctx.service.id} to ${dirPath}...`);
    console.log(`  Endpoints:`);
    ctx.service.endpoints.forEach((endpoint) => {
      console.log(`  - ${getSourceDisplayName(ctx.data, endpoint)}`);
    });

    const names = new UniqueNames();
    const endpoints = ctx.service.endpoints.map((endpoint) => {
      const handlerNames = new UniqueNames(fastEndpointBaseMembers);
      return {
        endpoint,
        plans: getEndpointParameters(ctx, endpoint, { supportNamespace }),
        result: buildStrictResult(ctx, endpoint, { namespace }),
        endpointName: names.next(this.getEndpointName(ctx, { endpoint })),
        handlerName: handlerNames.next(getHandlerMethodName(ctx, endpoint)),
      } satisfies Args.EndpointInfo;
    });

    const output: Output = { endpoints: {}, results: {} };
    for (const info of endpoints) {
      // An endpoint with several tags is part of several services but has one class and one result type.
      const isGenerated = Object.values(ctx.output.csharp.fastEndpoints).some((x) => info.endpoint.id in x.endpoints);
      if (!isGenerated) {
        this.generateResultFile(ctx, { info, dirPath, namespace });
        this.generateEndpointFile(ctx, { info, dirPath, namespace });
      }
      output.endpoints[info.endpoint.id] = cs.reference(info.endpointName, namespace);
      output.results[info.endpoint.id] = info.result.reference;
    }

    return output;
  }

  // #region Support files
  public generateSupportFiles(ctx: CSharpFastEndpointsGeneratorContext, _args: Args.GenerateSupportFiles = {}): void {
    const namespace = getServerNamespace(ctx, null);
    const dirPath = `${ctx.config.outputDir}/${ctx.config.fastEndpointsDir}`;

    for (const support of this.getSupportClasses(ctx)) {
      this.generateSupportFile(ctx, support, namespace, dirPath);
    }
  }

  /** The support types shared by all endpoints. */
  protected getSupportClasses(ctx: CSharpFastEndpointsGeneratorContext): SupportClass[] {
    return [
      buildApiJsonSupportClass(),
      buildApiRequestExceptionClass(),
      buildApiRequestSupportClass(),
      buildApiResponseSupportClass(),
      buildApiEndpointSupportClass(endpointSupportName, apiRequestExceptionName),
      this.getEndpointResponseClass(ctx),
    ];
  }

  protected generateSupportFile(
    ctx: CSharpFastEndpointsGeneratorContext,
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

  /** The class the result of a handler is converted to: it writes its response through `ApiResponseSupport`. */
  protected getEndpointResponseClass(_ctx: CSharpFastEndpointsGeneratorContext): SupportClass {
    return buildResponseWrapperClass(endpointResponseName, {
      doc: 'A response of an endpoint: status code, headers and a body.',
      execute: s<Builder>`
        /// <summary>Writes the response.</summary>
        /// <param name="response">The response of the current request.</param>
        /// <param name="cancellationToken">Signals that the request was aborted.</param>
        public ${cs.refs.system.task()} WriteAsync(${fastEndpointRefs.httpResponse()} response, ${cs.refs.system.cancellationToken()} cancellationToken)
        {
            return ApiResponseSupport.WriteAsync(response, statusCode, contentType, body, headers, cancellationToken);
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

  // #region Endpoint file
  protected generateEndpointFile(ctx: Context, args: Args.GenerateEndpointFile): void {
    const { info, dirPath, namespace } = args;
    const filePath = `${dirPath}/${info.endpointName}.cs`;
    console.log(`  Generating endpoint ${info.endpointName} to ${filePath}...`);

    const builder = new CSharpFileBuilder(namespace, ctx.config);
    builder.append(this.getEndpointFileContent(ctx, { info }));
    builder.writeToFile(filePath);
  }

  protected getEndpointFileContent(ctx: Context, args: Args.GetEndpointFileContent): AppendValueGroup<Builder> {
    return appendValueGroup<Builder>(['#pragma warning disable CS0612, CS0618', this.getEndpoint(ctx, args)], '\n');
  }

  protected getEndpoint(ctx: Context, args: Args.GetEndpoint): cs.Class<Builder> {
    const { info } = args;
    return cs.class<Builder>(info.endpointName, {
      doc: cs.doc(
        getEndpointDocDescription(ctx, info.endpoint) ||
          `The base class of the endpoint of the ${info.endpoint.name} operation. Derive from it and implement the abstract handler method.`,
      ),
      accessModifier: 'public',
      abstract: true,
      extends: fastEndpointRefs.endpointWithoutRequest.infer(),
      members: [
        this.getConfigureMethod(ctx, { info }),
        this.getConfigureEndpointHook(ctx, { info }),
        this.getHandleMethod(ctx, { info }),
        this.getHandlerMethod(ctx, { info }),
      ],
    });
  }

  /** Sets the verb and the route, then lets the derived endpoint configure the rest (authorization, summary, ...). */
  protected getConfigureMethod(ctx: Context, args: Args.GetConfigureMethod): cs.Method<Builder> {
    const { info } = args;
    const verb = info.endpoint.method.toUpperCase();
    const verbs = fastEndpointVerbs.has(verb)
      ? s<Builder>`${fastEndpointRefs.http()}.${verb}`
      : cs.string<Builder>(verb);

    return cs.method<Builder>('Configure', {
      doc: cs.doc(null),
      accessModifier: 'public',
      override: true,
      sealed: true,
      body: (b: Builder) => {
        b.appendLine(s<Builder>`Verbs(${verbs});`);
        b.appendLine(s<Builder>`Routes(${cs.string<Builder>(this.getRoute(ctx, { endpoint: info.endpoint }))});`);
        // The generated `HandleAsync` writes the response itself.
        b.appendLine('DontAutoSendResponse();');
        b.appendLine('ConfigureEndpoint();');
      },
    });
  }

  protected getRoute(ctx: Context, args: Args.GetRoute): string {
    return [getBasePath(ctx, ctx.service), getEndpointPath(ctx, args.endpoint)].filter((x) => x !== '').join('/');
  }

  protected getConfigureEndpointHook(_ctx: Context, _args: Args.GetConfigureEndpointHook): cs.Method<Builder> {
    return cs.method<Builder>('ConfigureEndpoint', {
      doc: cs.doc(
        'Configures the endpoint further, after the verb and the route are set: authorization, summary, tags and so on. Authorization is not configured by the generated code.',
      ),
      accessModifier: 'protected',
      virtual: true,
    });
  }

  protected getHandlerMethod(ctx: Context, args: Args.GetHandlerMethod): cs.Method<Builder> {
    const { info } = args;
    return getHandlerMethod(info.handlerName, info.plans, info.result.reference, {
      doc: getEndpointDocDescription(ctx, info.endpoint) || `Handles the ${info.endpoint.name} operation.`,
      accessModifier: 'protected',
    });
  }
  // #endregion

  // #region HandleAsync
  protected getHandleMethod(ctx: Context, args: Args.GetHandleMethod): cs.Method<Builder> {
    return cs.method<Builder>('HandleAsync', {
      doc: cs.doc(null),
      accessModifier: 'public',
      override: true,
      sealed: true,
      async: true,
      returnType: cs.refs.system.task(),
      parameters: [cs.parameter<Builder>('cancellationToken', cs.refs.system.cancellationToken())],
      body: this.getHandleBody(ctx, args),
    });
  }

  protected getHandleBody(ctx: Context, args: Args.GetHandleBody): AppendValue<Builder> {
    const { info } = args;
    const supportNamespace = this.getSupportNamespace(ctx, {});
    const exceptionRef = cs.reference<Builder>(apiRequestExceptionName, supportNamespace);
    const responseRef = cs.reference<Builder>(endpointResponseName, supportNamespace);

    const used = new UniqueNames(['cancellationToken', ...info.plans.flatMap((plan) => [plan.name, plan.valueName])]);
    const requestVariable = used.next('request');
    const formVariable = used.next('form');
    const resultVariable = used.next('result');
    const exceptionVariable = used.next('requestException');

    const usesForm = info.plans.some((plan) => plan.source === 'form');
    const handlerCall = cs.call<Builder>(
      info.handlerName,
      [...info.plans.map((plan) => plan.valueName), 'cancellationToken'],
      { await: true },
    );

    return (b: Builder) => {
      if (info.plans.length > 0) {
        b.appendLine(s<Builder>`var ${requestVariable} = HttpContext.Request;`);
        for (const plan of info.plans) {
          b.appendLine(s<Builder>`${plan.type} ${plan.valueName} = default!;`);
        }
        b.appendLine('try')
          .parenthesize(
            '{}',
            (b) => {
              if (usesForm) {
                b.appendLine(
                  s<Builder>`var ${formVariable} = await ${cs.reference<Builder>(endpointSupportName, supportNamespace)}.ReadFormAsync(${requestVariable}, cancellationToken);`,
                );
              }
              for (const plan of info.plans) {
                const binding = plan.binding;
                if (binding.kind === 'request') {
                  b.appendLine(
                    s<Builder>`${plan.valueName} = ${binding.convert(requestVariable, 'cancellationToken')};`,
                  );
                  continue;
                }

                const raw = this.getRawValue(ctx, { plan, request: requestVariable, form: formVariable });
                if (binding.convert) {
                  // The value the framework would have bound, which the shared conversion turns into the handler value.
                  b.appendLine(s<Builder>`${binding.actionType} ${binding.actionName} = ${raw};`);
                  b.appendLine(s<Builder>`${plan.valueName} = ${binding.convert(binding.actionName)};`);
                } else {
                  b.appendLine(s<Builder>`${plan.valueName} = ${raw};`);
                }
              }
            },
            { multiline: true },
          )
          .appendLine()
          .appendLine(s<Builder>`catch (${exceptionRef} ${exceptionVariable})`)
          .parenthesize(
            '{}',
            (b) => {
              b.appendLine(
                s<Builder>`await new ${responseRef}(${exceptionVariable}.StatusCode, "text/plain; charset=utf-8", ${exceptionVariable}.Message).WriteAsync(HttpContext.Response, cancellationToken);`,
              );
              b.appendLine('return;');
            },
            { multiline: true },
          )
          .appendLine()
          .appendLine();
      }

      b.appendLine(s<Builder>`var ${resultVariable} = ${handlerCall};`);
      b.appendLine();
      b.append('await (')
        .append(getResultSwitch(info.result, resultVariable, info.plans, responseRef))
        .appendLine(').WriteAsync(HttpContext.Response, cancellationToken);');
    };
  }

  /**
   * The expression that reads the value a framework would bind for a plan (`binding.actionType`) from the raw request.
   * It throws an `ApiRequestException` for a value that is missing but required, or not a valid scalar.
   */
  protected getRawValue(ctx: Context, args: Args.GetRawValue): AppendValue<Builder> {
    const { plan, request, form } = args;
    const binding = plan.binding;
    if (binding.kind !== 'bound') throw new Error(`The parameter ${plan.name} is not bound.`);

    const support = cs.reference<Builder>(endpointSupportName, this.getSupportNamespace(ctx, {}));
    const requestSupport = cs.reference<Builder>(apiRequestSupportName, this.getSupportNamespace(ctx, {}));
    const exception = cs.reference<Builder>(apiRequestExceptionName, this.getSupportNamespace(ctx, {}));
    const type = binding.actionType;
    const nullable = type.nullable;
    const wire = toCSharpStringLiteral(plan.wireName);
    const sourceName = plan.source === 'form' ? 'form' : plan.source;
    const missing = s<Builder>`throw new ${exception}(${toCSharpStringLiteral(`The ${sourceName} parameter '${plan.wireName}' is required.`)})`;

    // Files.
    if (type.name === 'IFormFile') {
      const value = s<Builder>`${support}.FormFile(${form}, ${wire})`;
      return nullable ? value : s<Builder>`${value} ?? ${missing}`;
    }
    if (type.name === 'IFormFileCollection') {
      const value = s<Builder>`${support}.FormFiles(${form}, ${wire}, ${String(!nullable)})`;
      return nullable ? value : s<Builder>`${value}!`;
    }

    // Repeated keys.
    if (type.arrayOf) {
      const value =
        plan.source === 'form'
          ? s<Builder>`${support}.FormValues(${form}, ${wire}, ${String(!nullable)})`
          : s<Builder>`${support}.QueryValues(${request}, ${wire}, ${String(!nullable)})`;
      return nullable ? value : s<Builder>`${value}!`;
    }

    const raw: AppendValue<Builder> = {
      path: s<Builder>`${support}.Route(${request}, ${wire})`,
      query: s<Builder>`${support}.Query(${request}, ${wire})`,
      header: s<Builder>`${support}.Header(${request}, ${wire})`,
      cookie: s<Builder>`${support}.Query(${request}, ${wire})`,
      body: s<Builder>`${support}.Query(${request}, ${wire})`,
      form: s<Builder>`${support}.FormValue(${form}, ${wire})`,
    }[plan.source];

    // Strings.
    if (type.name === 'string') return nullable ? raw : s<Builder>`${raw} ?? ${missing}`;

    // Numbers and booleans, which the controllers' model binding converts on its own.
    const target = cs.reference<Builder>(type.name, type.namespace);
    const parsed = s<Builder>`${requestSupport}.ParseValue(${raw}, typeof(${target}))`;
    return nullable ? s<Builder>`(${type})${parsed}` : s<Builder>`(${type})(${parsed} ?? ${missing})`;
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
    return `${ctx.config.outputDir}/${ctx.config.fastEndpointsDir}`;
  }

  protected getEndpointName(ctx: Context, args: Args.GetEndpointName): string {
    return toIdentifier(toCasing(`${args.endpoint.name}_EndpointBase`, ctx.config.typeNameCasing), 'EndpointBase');
  }
  // #endregion
}
