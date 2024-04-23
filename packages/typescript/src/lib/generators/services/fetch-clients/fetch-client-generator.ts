import { resolve } from 'path';

import {
  ApiEndpoint,
  ApiSchema,
  toCasing,
  AppendValueGroup,
  appendValueGroup,
  builderTemplate as s,
} from '@goast/core';

import { TypeScriptFetchClientGeneratorContext, TypeScriptFetchClientGeneratorOutput } from './models';
import { ts } from '../../../ast';
import { TypeScriptFileBuilder } from '../../../file-builder';
import { TypeScriptFileGenerator } from '../../file-generator';

type Context = TypeScriptFetchClientGeneratorContext;
type Output = TypeScriptFetchClientGeneratorOutput;
type Builder = TypeScriptFileBuilder;

export interface TypeScriptFetchClientGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): TOutput;
}

export class DefaultTypeScriptFetchClientGenerator
  extends TypeScriptFileGenerator<Context, Output>
  implements TypeScriptFetchClientGenerator
{
  public generate(ctx: Context): Output {
    const result: Output = {};

    if (this.shouldGenerateInterface(ctx)) {
      const filePath = this.getInterfaceFilePath(ctx);
      const name = this.getInterfaceName(ctx);

      TypeScriptFileBuilder.generate({
        logName: `interface ${name}`,
        filePath,
        options: ctx.config,
        generator: (b) => b.append(this.getInterfaceFileContent(ctx)),
      });

      result.interface = { filePath, component: name };
    }

    if (this.shouldGenerateClass(ctx)) {
      const filePath = this.getClassFilePath(ctx);
      const name = this.getClassName(ctx);

      TypeScriptFileBuilder.generate({
        logName: `class ${name}`,
        filePath,
        options: ctx.config,
        generator: (b) => b.append(this.getClassFileContent(ctx)),
      });

      result.class = { filePath, component: name };
    }

    return result;
  }

  // #region Interface
  protected getInterfaceFileContent(ctx: Context): AppendValueGroup<Builder> {
    return appendValueGroup([this.getInterface(ctx)], '\n');
  }

  protected getInterface(ctx: Context): ts.Interface<Builder> {
    return ts.interface(this.getInterfaceName(ctx), {
      doc: ts.doc({ description: ctx.service.description }),
      export: true,
      members: ctx.service.endpoints.map((endpoint) => this.getInterfaceEndpointMethod(ctx, endpoint)),
    });
  }

  protected getInterfaceEndpointMethod(ctx: Context, endpoint: ApiEndpoint): ts.Method<Builder> {
    const params = endpoint.parameters.filter((x) => x.target === 'path' || x.target === 'query');
    const bodySchema = endpoint.requestBody?.content[0]?.schema;
    const responseSchema = this.getResponseSchema(ctx, endpoint);
    return ts.method(toCasing(endpoint.name, ctx.config.methodCasing), {
      doc: ts.doc({ description: endpoint.description }),
      parameters: [
        params.length > 0
          ? ts.parameter('params', {
              description: 'Parameters for the endpoint.',
              type: ts.objectType({
                members: params.map((x) =>
                  ts.property(toCasing(x.name, ctx.config.propertyNameCasing), {
                    type: this.getSchemaType(ctx, x.schema),
                    optional: !x.required,
                  }),
                ),
              }),
            })
          : null,
        bodySchema &&
          ts.parameter('body', {
            description: 'Body for the endpoint.',
            type: this.getSchemaType(ctx, bodySchema),
          }),
      ],
      returnType: ts.refs.promise([ctx.refs.typedResponse([this.getSchemaType(ctx, responseSchema, ts.refs.void_())])]),
    });
  }
  // #endregion

  // #region Class
  protected getClassFileContent(ctx: Context): AppendValueGroup<Builder> {
    return appendValueGroup([this.getDefaultOptionsConstant(ctx), this.getClass(ctx)], '\n');
  }

  protected getDefaultOptionsConstant(ctx: Context): ts.Variable<Builder> {
    const baseUrl = ctx.service.endpoints
      .map((x) => x.$src?.document.servers?.find((x) => x.url)?.url)
      .find((x) => !!x);
    return ts.variable(this.getDefaultOptionsConstantName(ctx), {
      export: true,
      readonly: true,
      type: ctx.refs.fetchClientOptions(),
      value: ts.object({
        members: [baseUrl && ts.property('baseUrl', { value: ts.string(baseUrl) })],
      }),
    });
  }

  protected getClass(ctx: Context): ts.Class<Builder> {
    return ts.class(this.getClassName(ctx), {
      doc: ts.doc({ description: ctx.service.description }),
      export: true,
      implements: this.shouldGenerateInterface(ctx)
        ? [ts.reference(this.getInterfaceName(ctx), this.getInterfaceFilePath(ctx))]
        : undefined,
      members: [
        ts.property('options', {
          doc: ts.doc({ description: 'Options for the fetch client.' }),
          accessModifier: 'public',
          type: ctx.refs.fetchClientOptions(),
        }),
        ts.constructor({
          parameters: [
            ts.constructorParameter('options', {
              type: ts.refs.partial([ctx.refs.fetchClientOptions()]),
              optional: true,
            }),
          ],
          body: appendValueGroup(
            [s`this.options = { ...${this.getDefaultOptionsConstantName(ctx)}, ...options };`],
            '\n',
          ),
        }),
        ...ctx.service.endpoints.map((endpoint) => this.getServiceMethod(ctx, endpoint)),
      ],
    });
  }

  protected getServiceMethod(ctx: Context, endpoint: ApiEndpoint): ts.Method<Builder> {
    const method = this.getInterfaceEndpointMethod(ctx, endpoint);
    method.accessModifier = 'public';
    method.body = appendValueGroup(
      [
        s`const url = new ${ctx.refs.urlBuilder()}(this.options.baseUrl)${s.indent`
          .withPath(${ts.string(endpoint.path)})${(b) =>
            b.forEach(endpoint.parameters, (b, p) => {
              switch (p.target) {
                case 'path':
                  b.append(
                    s<Builder>`\n.withPathParam(${ts.string(p.name)}, params.${toCasing(p.name, ctx.config.paramNameCasing)})`,
                  );
                  break;
                case 'query':
                  b.append(
                    s<Builder>`\n.withQueryParam(${ts.string(p.name)}, params.${toCasing(p.name, ctx.config.paramNameCasing)})`,
                  );
                  break;
              }
            })}
          .build();`}`,
        s`const response = (this.options.fetch ?? fetch)(url, ${ts.object({
          members: [
            ts.property('method', { value: ts.string(toCasing(endpoint.method, 'all-upper')) }),
            ts.property('headers', { value: 'this.options.headers' }),
            endpoint.requestBody?.content[0]?.schema ? ts.property('body', { value: 'JSON.stringify(body)' }) : null,
          ],
        })});`,
        s`Object.defineProperty(response, 'isVoidResponse', { value: ${this.getResponseSchema(ctx, endpoint) ? 'false' : 'true'} });`,
        s`return response as unknown as ${method.returnType!};`,
      ],
      '\n',
    );
    return method;
  }
  // #endregion

  protected getSchemaType(ctx: Context, schema: ApiSchema | undefined, fallback?: ts.Type<Builder>): ts.Type<Builder> {
    const output = schema && ctx.input.models[schema.id];
    if (!output) return fallback ?? this.getAnyType(ctx);
    return (b) => b.appendModelUsage(output);
  }

  protected shouldGenerateInterface(ctx: Context): boolean {
    return ctx.config.clientFileKind === 'interface' || ctx.config.clientFileKind === 'class-and-interface';
  }

  protected shouldGenerateClass(ctx: Context): boolean {
    return ctx.config.clientFileKind === 'class' || ctx.config.clientFileKind === 'class-and-interface';
  }

  protected getInterfaceName(ctx: Context): string {
    return toCasing(ctx.service.name, ctx.config.interfaceNameCasing);
  }

  protected getClassName(ctx: Context): string {
    return toCasing(ctx.service.name, ctx.config.classNameCasing);
  }

  protected getDefaultOptionsConstantName(ctx: Context): string {
    return toCasing(this.getClassName(ctx) + '-default-options', ctx.config.constantNameCasing);
  }

  protected getInterfaceFilePath(ctx: Context): string {
    return resolve(
      ctx.config.outputDir,
      ctx.config.clientInterfaceDirPath ?? ctx.config.clientDirPath,
      `${toCasing(ctx.service.name, ctx.config.interfaceFileNameCasing ?? ctx.config.fileNameCasing)}.ts`,
    );
  }

  protected getClassFilePath(ctx: Context): string {
    return resolve(
      ctx.config.outputDir,
      ctx.config.clientDirPath,
      `${toCasing(ctx.service.name, ctx.config.fileNameCasing)}.ts`,
    );
  }

  protected getUtilPath(ctx: Context, fileName: string) {
    return resolve(ctx.config.outputDir, ctx.config.utilsDirPath, fileName);
  }

  private getResponseSchema(ctx: Context, endpoint: ApiEndpoint) {
    const successResponse =
      endpoint.responses.find((x) => x.statusCode === 200) ??
      endpoint.responses.find((x) => x.statusCode && x.statusCode > 200 && x.statusCode < 300);
    return successResponse?.contentOptions?.find((x) => x.schema !== undefined)?.schema;
  }
}
