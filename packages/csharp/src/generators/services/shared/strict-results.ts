import {
  type ApiEndpoint,
  type ApiResponse,
  appendValueGroup,
  builderTemplate as s,
  type SourceBuilder,
  toCasing,
} from '@goast/core';

import { cs } from '../../../ast/index.ts';
import type { CSharpFileBuilder } from '../../../file-builder.ts';
import {
  getContentBodyType,
  getResultTypeName,
  getStatusName,
  getTypeKey,
  getTypeUsage,
  toIdentifier,
  UniqueNames,
} from './endpoint-helpers.ts';
import type { CSharpServerContext } from './server-config.ts';

type Builder = CSharpFileBuilder;

/** A response header that is a parameter of a factory and a property of a case record. */
export type StrictResultHeader = {
  /** The name of the header on the wire (`X-Rate-Limit`). */
  name: string;
  /** The property of the case record (`XRateLimit`). */
  property: string;
  /** The parameter of the factory (`xRateLimit`). */
  parameter: string;
  /** The C# type, already nullable if the header is optional. */
  type: cs.Reference<SourceBuilder>;
  required: boolean;
  description: string | undefined;
};

/**
 * One documented response of an endpoint, as the result type models it. A server generator walks the cases to
 * emit its framework's conversion `switch`: every case is the nested record `caseType`, and the properties named
 * here are what the conversion reads from it.
 */
export type StrictResultCase = {
  response: ApiResponse;
  /** The response key as the spec wrote it: `200`, `2XX` or `default`. */
  statusKey: string;
  /** The exact status code, for an exact key. */
  statusCode: number | undefined;
  /** The inclusive status range of a `NXX` key. */
  range: { min: number; max: number } | undefined;
  isDefault: boolean;
  /** The name of the static factory (`Ok`, `NotFound`, `Status2XX`, `Default`). */
  factoryName: string;
  /** The name of the nested case record (`OkResponse`). */
  caseTypeName: string;
  /** A reference to the nested case record (`GetPetResult.OkResponse`), for patterns in `switch` arms. */
  caseType: cs.Reference<SourceBuilder>;
  /** The type of the body, or `undefined` for a response without a body. `object` if the content types differ. */
  bodyType: cs.Reference<SourceBuilder> | undefined;
  headers: StrictResultHeader[];
  /** The content types of the response, in declaration order. Empty for a response without a body. */
  contentTypes: string[];
  /** The property carrying the status code: only range and `default` cases have one. */
  statusCodeProperty: string | undefined;
  /** The property carrying the body, if the response has one. */
  bodyProperty: string | undefined;
  /** The property carrying the content type: only a response with several content types has one. */
  contentTypeProperty: string | undefined;
  /** The content type a body is written with if the case does not carry one (the first declared). */
  defaultContentType: string | undefined;
};

export type StrictResult = {
  /** The name of the abstract result record (`GetPetResult`). */
  name: string;
  namespace: string;
  reference: cs.Reference<SourceBuilder>;
  /** The declaration to write to a file of its own. */
  record: cs.Record<Builder>;
  cases: StrictResultCase[];
};

const statusCodeProperty = 'StatusCode';
const bodyProperty = 'Body';
const contentTypeProperty = 'ContentType';

/**
 * Builds the strict result type of an endpoint: an abstract record with a private constructor, one static factory per
 * documented response key and one nested sealed case record per factory.
 *
 * ```csharp
 * public abstract record GetPetByIdResult
 * {
 *     private GetPetByIdResult() { }
 *     public static GetPetByIdResult Ok(Pet body) => new OkResponse(body);
 *     public static GetPetByIdResult NotFound() => new NotFoundResponse();
 *     public static GetPetByIdResult Default(int statusCode, Error body) => new DefaultResponse(statusCode, body);
 *     public sealed record OkResponse(Pet Body) : GetPetByIdResult;
 *     ...
 * }
 * ```
 *
 * Range and `default` keys take the status code as their first parameter (and reject codes outside of their range),
 * the response headers of the spec follow the body (required ones first), and a response with several content types
 * takes a trailing `contentType` parameter that defaults to the first declared one. The returned `cases` describe
 * everything a framework-specific conversion needs.
 */
export function buildStrictResult(
  ctx: CSharpServerContext,
  endpoint: ApiEndpoint,
  options: { namespace: string; name?: string },
): StrictResult {
  const name = options.name ?? getResultTypeName(ctx, endpoint);
  const resultReference = cs.reference(name, options.namespace);

  const usedFactoryNames = new UniqueNames();
  const cases = endpoint.responses.map((response) =>
    buildCase(ctx, response, name, options.namespace, usedFactoryNames),
  );

  const record = cs.record<Builder>(name, {
    doc: cs.doc(`The documented results of the ${endpoint.name} operation.`),
    accessModifier: 'public',
    abstract: true,
    members: [
      cs.constructor<Builder>([], null, { accessModifier: 'private' }),
      ...cases.map((c) => getFactory(resultReference, c)),
      ...cases.map((c) => getCaseRecord(resultReference, c)),
    ],
  });

  return { name, namespace: options.namespace, reference: resultReference, record, cases };
}

function buildCase(
  ctx: CSharpServerContext,
  response: ApiResponse,
  resultName: string,
  namespace: string,
  usedFactoryNames: UniqueNames,
): StrictResultCase {
  const statusKey = response.statusKey;
  const isDefault = statusKey.toLowerCase() === 'default';
  const rangeMatch = /^([1-5])[xX]{2}$/.exec(statusKey);
  const range = rangeMatch ? { min: Number(rangeMatch[1]) * 100, max: Number(rangeMatch[1]) * 100 + 99 } : undefined;
  const statusCode = isDefault || range ? undefined : Number(statusKey);

  const factoryName = usedFactoryNames.next(getStatusName(statusKey));
  const caseTypeName = `${factoryName}Response`;

  const contentTypes = [...new Set(response.contentOptions.map((x) => x.type))];
  const bodyTypes = response.contentOptions.map((x) => getContentBodyType(ctx, x));
  const keys = new Set(bodyTypes.map(getTypeKey));
  const bodyType =
    bodyTypes.length === 0 ? undefined : keys.size === 1 ? bodyTypes[0] : cs.refs.system.object<SourceBuilder>();

  const reserved = [statusCodeProperty, bodyProperty, contentTypeProperty, 'EqualityContract'];
  const usedProperties = new UniqueNames(reserved);
  const usedParameters = new UniqueNames(reserved.map((x) => x.charAt(0).toLowerCase() + x.slice(1)));
  const headers = response.headers
    .filter((header) => header.name.toLowerCase() !== 'content-type')
    .map((header): StrictResultHeader => {
      const required = header.required;
      return {
        name: header.name,
        property: usedProperties.next(toIdentifier(toCasing(header.name, ctx.config.propertyNameCasing), 'Header')),
        parameter: usedParameters.next(toIdentifier(toCasing(header.name, ctx.config.parameterNameCasing), 'header')),
        type: getTypeUsage(ctx, header.schema, required ? undefined : true, cs.refs.system.string()),
        required,
        description: header.description?.trim() || undefined,
      };
    });

  return {
    response,
    statusKey,
    statusCode,
    range,
    isDefault,
    factoryName,
    caseTypeName,
    caseType: cs.reference(`${resultName}.${caseTypeName}`, namespace),
    bodyType,
    headers,
    contentTypes,
    statusCodeProperty: isDefault || range ? statusCodeProperty : undefined,
    bodyProperty: bodyType ? bodyProperty : undefined,
    contentTypeProperty: bodyType && contentTypes.length > 1 ? contentTypeProperty : undefined,
    defaultContentType: contentTypes[0],
  };
}

function getFactory(resultReference: cs.Reference<SourceBuilder>, c: StrictResultCase): cs.Method<Builder> {
  const requiredHeaders = c.headers.filter((x) => x.required);
  const optionalHeaders = c.headers.filter((x) => !x.required);

  const parameters = [
    c.statusCodeProperty
      ? cs.parameter<Builder>('statusCode', cs.refs.system.int(), {
          description: c.range
            ? `The status code. It must be in the range ${c.range.min} to ${c.range.max}.`
            : 'The status code.',
        })
      : null,
    c.bodyProperty && c.bodyType
      ? cs.parameter<Builder>('body', c.bodyType, { description: 'The response body.' })
      : null,
    ...requiredHeaders.map((x) => cs.parameter<Builder>(x.parameter, x.type, { description: x.description })),
    ...optionalHeaders.map((x) =>
      cs.parameter<Builder>(x.parameter, x.type, { description: x.description, default: 'null' }),
    ),
    c.contentTypeProperty
      ? cs.parameter<Builder>('contentType', cs.refs.system.string(), {
          description: 'The content type of the body.',
          default: cs.string(c.defaultContentType ?? ''),
        })
      : null,
  ];

  const create = cs.objectCreation<Builder>(c.caseTypeName.replace(/^.*\./, ''), [
    c.statusCodeProperty ? 'statusCode' : null,
    c.bodyProperty ? 'body' : null,
    ...c.headers.map((x) => x.parameter),
    c.contentTypeProperty ? 'contentType' : null,
  ]);

  const bounds = c.range ?? (c.isDefault ? { min: 100, max: 599 } : undefined);
  const doc = cs.doc(c.response.description?.trim() || `The ${c.statusKey} response.`);
  const common = {
    doc,
    accessModifier: 'public' as const,
    static: true,
    returnType: resultReference,
    parameters,
  };

  if (!bounds) {
    return cs.method<Builder>(c.factoryName, { ...common, singleExpression: true, body: create });
  }

  const argumentException = cs.reference<Builder>('ArgumentOutOfRangeException', 'System');
  const message = `The status code must be in the range ${bounds.min} to ${bounds.max}.`;
  return cs.method<Builder>(c.factoryName, {
    ...common,
    body: appendValueGroup<Builder>(
      [
        `if (statusCode is < ${bounds.min} or > ${bounds.max})`,
        '{',
        s<Builder>`    throw new ${argumentException}(nameof(statusCode), statusCode, ${cs.string<Builder>(message)});`,
        '}',
        '',
        s<Builder>`return ${create};`,
      ],
      '\n',
    ),
  });
}

function getCaseRecord(resultReference: cs.Reference<SourceBuilder>, c: StrictResultCase): cs.Record<Builder> {
  return cs.record<Builder>(c.caseTypeName, {
    doc: cs.doc(c.response.description?.trim() || `The ${c.statusKey} response.`),
    accessModifier: 'public',
    sealed: true,
    parameters: [
      c.statusCodeProperty ? cs.parameter<Builder>(c.statusCodeProperty, cs.refs.system.int()) : null,
      c.bodyProperty && c.bodyType ? cs.parameter<Builder>(c.bodyProperty, c.bodyType) : null,
      ...c.headers.map((x) => cs.parameter<Builder>(x.property, x.type, { description: x.description })),
      c.contentTypeProperty ? cs.parameter<Builder>(c.contentTypeProperty, cs.refs.system.string()) : null,
    ],
    extends: cs.reference(resultReference.name),
  });
}
