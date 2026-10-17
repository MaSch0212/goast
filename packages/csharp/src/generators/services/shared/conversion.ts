import { type AppendValue, builderTemplate as s } from '@goast/core';

import { cs } from '../../../ast/index.ts';
import type { CSharpFileBuilder } from '../../../file-builder.ts';
import type { ParameterPlan } from './parameters.ts';
import type { SupportClass } from './support-classes.ts';
import type { StrictResult, StrictResultCase } from './strict-results.ts';
import { UniqueNames } from './endpoint-helpers.ts';

type Builder = CSharpFileBuilder;

/** The plans whose handler value has to be computed from the bound or requested value. */
export function getConvertedPlans(plans: readonly ParameterPlan[]): ParameterPlan[] {
  return plans.filter((plan) => plan.binding.kind === 'request' || plan.binding.convert !== null);
}

/**
 * Appends the statements that turn the bound values into the handler values: a declaration per converted plan
 * (`T value = default!;`) followed by a `try` block that assigns them and a `catch` that runs `onException`
 * (a statement list, given the name of the caught exception) when a value cannot be converted. Appends nothing
 * if no plan is converted.
 */
export function appendParameterConversion(
  b: Builder,
  plans: readonly ParameterPlan[],
  options: {
    /** The expression of the `HttpRequest`, for the values the framework does not bind. */
    request: string;
    cancellationToken: string;
    exception: cs.Reference<Builder>;
    exceptionVariable: string;
    /** The statement answering the request for the caught exception. */
    onException: (exceptionVariable: string) => AppendValue<Builder>;
  },
): void {
  const converted = getConvertedPlans(plans);
  if (converted.length === 0) return;

  for (const plan of converted) {
    b.appendLine(s<Builder>`${plan.type} ${plan.valueName} = default!;`);
  }
  b.appendLine('try')
    .parenthesize(
      '{}',
      (b) => {
        for (const plan of converted) {
          const binding = plan.binding;
          const expression: AppendValue<Builder> =
            binding.kind === 'request'
              ? binding.convert(options.request, options.cancellationToken)
              : binding.convert!(binding.actionName);
          b.appendLine(s<Builder>`${plan.valueName} = ${expression};`);
        }
      },
      { multiline: true },
    )
    .appendLine()
    .appendLine(s<Builder>`catch (${options.exception} ${options.exceptionVariable})`)
    .parenthesize('{}', (b) => b.appendLine(options.onException(options.exceptionVariable)), { multiline: true })
    .appendLine()
    .appendLine();
}

/**
 * The exhaustive conversion of a result to a response: a `switch` expression with one arm per documented response,
 * each creating `new <wrapper>(statusCode, contentType, body, headers...)`. `wrapper` is the generated type that
 * writes a response through `ApiResponseSupport` (`ApiActionResult`, `ApiHttpResult`, ...).
 */
export function getResultSwitch(
  result: StrictResult,
  variable: string,
  plans: readonly ParameterPlan[],
  wrapper: cs.Reference<Builder>,
): cs.SwitchExpression<Builder> {
  const used = new UniqueNames([
    'cancellationToken',
    variable,
    ...plans.flatMap((plan) => [plan.name, plan.valueName]),
  ]);
  const pattern = used.next('response');

  return cs.switchExpression<Builder>(variable, [
    ...result.cases.map((resultCase) => getResultArm(resultCase, pattern, wrapper)),
    cs.switchExpression.arm(
      '_',
      s<Builder>`throw new ${cs.refs.system.invalidOperationException()}("The result is not one of the documented responses.")`,
    ),
  ]);
}

export function getResultArm(
  c: StrictResultCase,
  variable: string,
  wrapper: cs.Reference<Builder>,
): ReturnType<typeof cs.switchExpression.arm<Builder>> {
  const contentType = !c.bodyProperty
    ? 'null'
    : c.contentTypeProperty
      ? `${variable}.${c.contentTypeProperty}`
      : cs.string<Builder>(c.defaultContentType ?? '');
  const usesVariable = c.statusCodeProperty || c.bodyProperty || c.headers.length > 0;
  return cs.switchExpression.arm(
    usesVariable ? s<Builder>`${c.caseType} ${variable}` : c.caseType,
    cs.objectCreation<Builder>(wrapper, [
      c.statusCodeProperty ? `${variable}.${c.statusCodeProperty}` : String(c.statusCode),
      contentType,
      c.bodyProperty ? `${variable}.${c.bodyProperty}` : 'null',
      ...c.headers.map((header) => s<Builder>`(${cs.string<Builder>(header.name)}, ${variable}.${header.property})`),
    ]),
  );
}

/**
 * The sealed class every server generator converts a strict result to: it holds the status code, content type, body
 * and headers of one response and writes them through `ApiResponseSupport`. Only the interface of the framework (an
 * `IActionResult`, an `IResult`) and its execute method differ, so they are given.
 *
 * The execute method receives the name of the class and must return `ApiResponseSupport.WriteAsync(...)`.
 */
export function buildResponseWrapperClass(
  name: string,
  options: { doc: string; implements?: cs.Reference<Builder>; execute: AppendValue<Builder> },
): SupportClass {
  const declaration = cs.class<Builder>(name, {
    doc: cs.doc(options.doc),
    accessModifier: 'public',
    sealed: true,
    implements: options.implements ? [options.implements] : [],
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
        `public ${name}(int statusCode, string? contentType, object? body, params (string Name, object? Value)[] headers)`,
        '{',
        '    this.statusCode = statusCode;',
        '    this.contentType = contentType;',
        '    this.body = body;',
        '    this.headers = headers;',
        '}',
      ].join('\n'),
      options.execute,
    ],
  });
  return { name, declaration, usings: [] };
}
