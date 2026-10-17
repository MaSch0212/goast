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
import { CSharpFileGenerator } from '../../file-generator.ts';
import {
  buildApiJsonSupportClass,
  buildApiRequestExceptionClass,
  buildApiRequestSupportClass,
  buildApiResponseSupportClass,
  buildStrictResult,
  getBasePath,
  getEndpointDocDescription,
  getEndpointParameters,
  getEndpointPath,
  getHandlerMethod,
  getHandlerMethodName,
  getServerNamespace,
  type SupportClass,
  toIdentifier,
  toRouteTemplate,
  UniqueNames,
  withNullable,
} from '../shared/index.ts';
import type { DefaultCSharpControllerGeneratorArgs as Args } from './index.ts';
import type {
  CSharpControllerGeneratorContext,
  CSharpControllerGeneratorOutput,
  CSharpControllersGeneratorContext,
} from './models.ts';

type Context = CSharpControllerGeneratorContext;
type Output = CSharpControllerGeneratorOutput;
type Builder = CSharpFileBuilder;

/** The name of the generated `IActionResult` the actions return. */
const actionResultName = 'ApiActionResult';

/** The members `ControllerBase` declares: an action or handler of the same name would hide them. */
const controllerBaseMembers = [
  'Accepted',
  'AcceptedAtAction',
  'AcceptedAtRoute',
  'BadRequest',
  'Challenge',
  'Conflict',
  'Content',
  'Created',
  'CreatedAtAction',
  'CreatedAtRoute',
  'Empty',
  'Equals',
  'File',
  'Forbid',
  'GetHashCode',
  'GetType',
  'HttpContext',
  'LocalRedirect',
  'LocalRedirectPermanent',
  'LocalRedirectPermanentPreserveMethod',
  'LocalRedirectPreserveMethod',
  'MemberwiseClone',
  'MetadataProvider',
  'ModelBinderFactory',
  'ModelState',
  'NoContent',
  'NotFound',
  'ObjectValidator',
  'Ok',
  'PhysicalFile',
  'Problem',
  'ProblemDetailsFactory',
  'Redirect',
  'RedirectPermanent',
  'RedirectPermanentPreserveMethod',
  'RedirectPreserveMethod',
  'RedirectToAction',
  'RedirectToActionPermanent',
  'RedirectToPage',
  'RedirectToRoute',
  'Request',
  'Response',
  'RouteData',
  'SignIn',
  'SignOut',
  'StatusCode',
  'ToString',
  'TryUpdateModelAsync',
  'TryValidateModel',
  'Unauthorized',
  'UnprocessableEntity',
  'Url',
  'User',
  'ValidationProblem',
  'VirtualFile',
];

const aspNetMvc = (name: string) => cs.reference.factory(name, 'Microsoft.AspNetCore.Mvc');

export interface CSharpControllerGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): MaybePromise<TOutput>;
  generateSupportFiles(ctx: CSharpControllersGeneratorContext): MaybePromise<void>;
}

export class DefaultCSharpControllerGenerator
  extends CSharpFileGenerator<Context, Output>
  implements CSharpControllerGenerator
{
  public generate(ctx: Context): MaybePromise<Output> {
    const namespace = this.getNamespace(ctx, {});
    const dirPath = this.getDirectoryPath(ctx, {});
    const supportNamespace = this.getSupportNamespace(ctx, {});
    const controllerName = this.getControllerName(ctx, {});

    console.log(`Generating service ${ctx.service.id} to ${dirPath}...`);
    console.log(`  Endpoints:`);
    ctx.service.endpoints.forEach((endpoint) => {
      console.log(`  - ${getSourceDisplayName(ctx.data, endpoint)}`);
    });

    const names = new UniqueNames(controllerBaseMembers);
    const endpoints = ctx.service.endpoints.map((endpoint) => {
      const base = toIdentifier(toCasing(endpoint.name, ctx.config.methodNameCasing), 'Action');
      const actionName = names.next(base);
      const handlerName = names.next(getHandlerMethodName(ctx, endpoint));
      return {
        endpoint,
        plans: getEndpointParameters(ctx, endpoint, { supportNamespace }),
        result: buildStrictResult(ctx, endpoint, { namespace }),
        actionName,
        handlerName,
      } satisfies Args.EndpointInfo;
    });

    const results: Output['results'] = {};
    for (const info of endpoints) {
      // An endpoint with several tags is part of several services but has one result type, so one file.
      const isGenerated = Object.values(ctx.output.csharp.controllers).some((x) => info.endpoint.id in x.results);
      if (!isGenerated) this.generateResultFile(ctx, { info, dirPath, namespace });
      results[info.endpoint.id] = info.result.reference;
    }

    this.generateControllerFile(ctx, { dirPath, namespace, controllerName, endpoints });

    return { controller: cs.reference(controllerName, namespace), results };
  }

  // #region Support files
  public generateSupportFiles(ctx: CSharpControllersGeneratorContext, _args: Args.GenerateSupportFiles = {}): void {
    const namespace = getServerNamespace(ctx, null);
    const dirPath = `${ctx.config.outputDir}/${ctx.config.controllersDir}`;

    for (const support of this.getSupportClasses(ctx)) {
      this.generateSupportFile(ctx, support, namespace, dirPath);
    }
    this.generateSupportFile(ctx, this.getActionResultClass(ctx), namespace, dirPath);
  }

  /** The support types shared by all controllers. */
  protected getSupportClasses(_ctx: CSharpControllersGeneratorContext): SupportClass[] {
    return [
      buildApiJsonSupportClass(),
      buildApiRequestExceptionClass(),
      buildApiRequestSupportClass(),
      buildApiResponseSupportClass(),
    ];
  }

  protected generateSupportFile(
    ctx: CSharpControllersGeneratorContext,
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

  /** The `IActionResult` that writes a response through `ApiResponseSupport`. */
  protected getActionResultClass(_ctx: CSharpControllersGeneratorContext): SupportClass {
    const iActionResult = aspNetMvc('IActionResult');
    const actionContext = cs.reference.factory('ActionContext', 'Microsoft.AspNetCore.Mvc');
    const declaration = cs.class<Builder>(actionResultName, {
      doc: cs.doc('An action result that writes a response: status code, headers and a body.'),
      accessModifier: 'public',
      sealed: true,
      implements: [iActionResult()],
      members: [
        cs.field<Builder>('statusCode', { type: cs.refs.system.int(), accessModifier: 'private', readonly: true }),
        cs.field<Builder>('contentType', {
          type: cs.refs.system.string({ nullable: true }),
          accessModifier: 'private',
          readonly: true,
        }),
        cs.field<Builder>('body', {
          type: cs.refs.system.object({ nullable: true }),
          accessModifier: 'private',
          readonly: true,
        }),
        cs.field<Builder>('headers', {
          type: '(string Name, object? Value)[]',
          accessModifier: 'private',
          readonly: true,
        }),
        [
          '/// <summary>Creates the result.</summary>',
          '/// <param name="statusCode">The status code of the response.</param>',
          '/// <param name="contentType">The content type of the body. Ignored without a body.</param>',
          '/// <param name="body">The body, or <c>null</c> for a response without a body.</param>',
          '/// <param name="headers">The response headers. A header without a value is not sent.</param>',
          `public ${actionResultName}(int statusCode, string? contentType, object? body, params (string Name, object? Value)[] headers)`,
          '{',
          '    this.statusCode = statusCode;',
          '    this.contentType = contentType;',
          '    this.body = body;',
          '    this.headers = headers;',
          '}',
        ].join('\n'),
        s<Builder>`
          /// <inheritdoc />
          public ${cs.refs.system.task()} ExecuteResultAsync(${actionContext()} context)
          {
              return ApiResponseSupport.WriteAsync(context.HttpContext.Response, statusCode, contentType, body, headers, context.HttpContext.RequestAborted);
          }
        `,
      ],
    });
    return { name: actionResultName, declaration, usings: [] };
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

  // #region Controller file
  protected generateControllerFile(ctx: Context, args: Args.GenerateControllerFile): void {
    const { dirPath, namespace, controllerName, endpoints } = args;
    const filePath = `${dirPath}/${controllerName}.cs`;
    console.log(`  Generating controller ${controllerName} to ${filePath}...`);

    const builder = new CSharpFileBuilder(namespace, ctx.config);
    builder.append(this.getControllerFileContent(ctx, { controllerName, endpoints }));
    builder.writeToFile(filePath);
  }

  protected getControllerFileContent(ctx: Context, args: Args.GetControllerFileContent): AppendValueGroup<Builder> {
    return appendValueGroup<Builder>(['#pragma warning disable CS0612, CS0618', this.getController(ctx, args)], '\n');
  }

  protected getController(ctx: Context, args: Args.GetController): cs.Class<Builder> {
    const { controllerName, endpoints } = args;
    return cs.class<Builder>(controllerName, {
      doc: cs.doc(
        ctx.service.description?.trim() ||
          `The base class of the controller of the ${ctx.service.name} API. Derive from it and implement the abstract handler methods.`,
      ),
      attributes: this.getControllerAttributes(ctx, {}),
      accessModifier: 'public',
      abstract: true,
      extends: cs.refs.aspNetCore.mvc.controllerBase(),
      members: endpoints.flatMap((info) => this.getEndpointMembers(ctx, { info })),
    });
  }

  protected getControllerAttributes(ctx: Context, _args: Args.GetControllerAttributes): cs.Attribute<Builder>[] {
    const basePath = getBasePath(ctx, ctx.service);
    return [
      cs.attribute(cs.refs.aspNetCore.mvc.apiController()),
      basePath ? cs.attribute(cs.refs.aspNetCore.mvc.route(), [cs.string(toRouteTemplate(basePath))]) : null,
    ].filter(notNullish);
  }

  protected getEndpointMembers(ctx: Context, args: Args.GetEndpointMembers): cs.ClassMember<Builder>[] {
    return [this.getAction(ctx, args), this.getHandlerMethod(ctx, args)];
  }

  protected getHandlerMethod(ctx: Context, args: Args.GetHandlerMethod): cs.Method<Builder> {
    const { info } = args;
    // Public methods of a controller are actions, so the handler is protected.
    return getHandlerMethod(info.handlerName, info.plans, info.result.reference, {
      doc: getEndpointDocDescription(ctx, info.endpoint) || `Handles the ${info.endpoint.name} operation.`,
      accessModifier: 'protected',
    });
  }
  // #endregion

  // #region Action
  protected getAction(ctx: Context, args: Args.GetAction): cs.Method<Builder> {
    const { info } = args;
    return cs.method<Builder>(info.actionName, {
      doc: cs.doc(getEndpointDocDescription(ctx, info.endpoint) || `Handles the ${info.endpoint.name} operation.`),
      attributes: this.getActionAttributes(ctx, { info }),
      accessModifier: 'public',
      async: true,
      returnType: cs.refs.system.taskOf([cs.refs.aspNetCore.mvc.iActionResult()]),
      parameters: [
        ...info.plans.map((plan) => this.getActionParameter(ctx, { info, plan })).filter(notNullish),
        cs.parameter<Builder>('cancellationToken', cs.refs.system.cancellationToken()),
      ],
      body: this.getActionBody(ctx, { info }),
    });
  }

  protected getActionAttributes(ctx: Context, args: Args.GetActionAttributes): cs.Attribute<Builder>[] {
    const { info } = args;
    return [
      this.getRouteAttribute(ctx, { endpoint: info.endpoint }),
      this.getConsumesAttribute(ctx, { endpoint: info.endpoint }),
      ...this.getProducesAttributes(ctx, { result: info.result }),
    ].filter(notNullish);
  }

  protected getRouteAttribute(ctx: Context, args: Args.GetRouteAttribute): cs.Attribute<Builder> {
    const { endpoint } = args;
    const path = cs.string(toRouteTemplate(getEndpointPath(ctx, endpoint)));
    const httpMethods = {
      get: cs.refs.aspNetCore.mvc.httpGet,
      post: cs.refs.aspNetCore.mvc.httpPost,
      put: cs.refs.aspNetCore.mvc.httpPut,
      patch: cs.refs.aspNetCore.mvc.httpPatch,
      delete: cs.refs.aspNetCore.mvc.httpDelete,
      head: cs.refs.aspNetCore.mvc.httpHead,
      options: cs.refs.aspNetCore.mvc.httpOptions,
    } as const;

    const factory = (httpMethods as Record<string, cs.ReferenceFactory | undefined>)[endpoint.method];
    if (factory) return cs.attribute(factory(), [path]);
    return cs.attribute(aspNetMvc('AcceptVerbs')(), [cs.string(endpoint.method.toUpperCase())], {
      properties: { Route: path },
    });
  }

  protected getConsumesAttribute(_ctx: Context, args: Args.GetConsumesAttribute): cs.Attribute<Builder> | null {
    const contentTypes = [...new Set(args.endpoint.requestBody?.content.map((x) => x.type) ?? [])].filter(
      (x) => !x.includes('*'),
    );
    if (contentTypes.length === 0) return null;
    return cs.attribute(
      cs.refs.aspNetCore.mvc.consumes(),
      contentTypes.map((x) => cs.string(x)),
    );
  }

  protected getProducesAttributes(_ctx: Context, args: Args.GetProducesAttributes): cs.Attribute<Builder>[] {
    return args.result.cases.flatMap((c): cs.Attribute<Builder>[] => {
      // MVC can only describe an exact status code and the `default` response.
      const bodyType = c.bodyType && c.bodyType.name !== 'object' ? withNullable(c.bodyType, false) : undefined;
      if (c.isDefault) {
        return [
          cs.attribute(aspNetMvc('ProducesDefaultResponseType')(), bodyType ? [cs.call('typeof', [bodyType])] : []),
        ];
      }
      if (c.statusCode === undefined) return [];
      return [
        cs.attribute(cs.refs.aspNetCore.mvc.producesResponseType(), [
          bodyType ? cs.call('typeof', [bodyType]) : null,
          String(c.statusCode),
          ...(bodyType ? c.contentTypes.map((x) => cs.string(x)) : []),
        ]),
      ];
    });
  }

  protected getActionParameter(_ctx: Context, args: Args.GetActionParameter): cs.Parameter<Builder> | null {
    const { plan } = args;
    if (plan.binding.kind !== 'bound') return null;
    return cs.parameter<Builder>(plan.binding.actionName, plan.binding.actionType, {
      attributes: [this.getBindingAttribute(_ctx, { plan, actionName: plan.binding.actionName })],
    });
  }

  /** The attribute that tells MVC where to find the value, always with the name on the wire. */
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

  protected getActionBody(ctx: Context, args: Args.GetActionBody): AppendValue<Builder> {
    const { info } = args;
    const supportNamespace = this.getSupportNamespace(ctx, {});
    const exceptionRef = cs.reference<Builder>('ApiRequestException', supportNamespace);

    const used = new UniqueNames(['cancellationToken', ...info.plans.flatMap((plan) => [plan.name, plan.valueName])]);
    const resultVariable = used.next('result');
    const exceptionVariable = used.next('requestException');

    const converted = info.plans.filter((plan) => plan.binding.kind === 'request' || plan.binding.convert !== null);
    const handlerCall = cs.call<Builder>(
      info.handlerName,
      [...info.plans.map((plan) => plan.valueName), 'cancellationToken'],
      { await: true },
    );

    return (b: Builder) => {
      if (converted.length > 0) {
        for (const plan of converted) {
          b.appendLine(s<Builder>`${plan.type} ${plan.valueName} = default!;`);
        }
        b.appendLine('try')
          .parenthesize(
            '{}',
            (b) => {
              for (const plan of converted) {
                const binding = plan.binding;
                const expression =
                  binding.kind === 'request'
                    ? binding.convert('Request', 'cancellationToken')
                    : binding.convert!(binding.actionName);
                b.appendLine(s<Builder>`${plan.valueName} = ${expression};`);
              }
            },
            { multiline: true },
          )
          .appendLine()
          .appendLine(s<Builder>`catch (${exceptionRef} ${exceptionVariable})`)
          .parenthesize(
            '{}',
            (b) => b.appendLine(`return StatusCode(${exceptionVariable}.StatusCode, ${exceptionVariable}.Message);`),
            { multiline: true },
          )
          .appendLine()
          .appendLine();
      }

      b.appendLine(s<Builder>`var ${resultVariable} = ${handlerCall};`);
      b.appendLine();
      b.append('return ')
        .append(this.getResultSwitch(ctx, { info, variable: resultVariable }))
        .appendLine(';');
    };
  }

  /** The exhaustive conversion of the result to an action result: one arm per documented response. */
  protected getResultSwitch(ctx: Context, args: Args.GetResultSwitch): cs.SwitchExpression<Builder> {
    const { info, variable } = args;
    const used = new UniqueNames([
      'cancellationToken',
      variable,
      ...info.plans.flatMap((plan) => [plan.name, plan.valueName]),
    ]);
    const pattern = used.next('response');

    return cs.switchExpression<Builder>(variable, [
      ...info.result.cases.map((resultCase) => this.getResultArm(ctx, { info, resultCase, variable: pattern })),
      cs.switchExpression.arm(
        '_',
        s<Builder>`throw new ${cs.refs.system.invalidOperationException()}("The result is not one of the documented responses.")`,
      ),
    ]);
  }

  protected getResultArm(ctx: Context, args: Args.GetResultArm): ReturnType<typeof cs.switchExpression.arm<Builder>> {
    const { resultCase: c, variable } = args;
    const supportNamespace = this.getSupportNamespace(ctx, {});
    const actionResult = cs.reference<Builder>(actionResultName, supportNamespace);

    const contentType = !c.bodyProperty
      ? 'null'
      : c.contentTypeProperty
        ? `${variable}.${c.contentTypeProperty}`
        : cs.string<Builder>(c.defaultContentType ?? '');
    const usesVariable = c.statusCodeProperty || c.bodyProperty || c.headers.length > 0;
    return cs.switchExpression.arm(
      usesVariable ? s<Builder>`${c.caseType} ${variable}` : c.caseType,
      cs.objectCreation<Builder>(actionResult, [
        c.statusCodeProperty ? `${variable}.${c.statusCodeProperty}` : String(c.statusCode),
        contentType,
        c.bodyProperty ? `${variable}.${c.bodyProperty}` : 'null',
        ...c.headers.map((header) => s<Builder>`(${cs.string<Builder>(header.name)}, ${variable}.${header.property})`),
      ]),
    );
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
    return `${ctx.config.outputDir}/${ctx.config.controllersDir}`;
  }

  protected getControllerName(ctx: Context, _args: Args.GetControllerName): string {
    return toIdentifier(toCasing(`${ctx.service.name}_ControllerBase`, ctx.config.typeNameCasing), 'ControllerBase');
  }
  // #endregion
}
