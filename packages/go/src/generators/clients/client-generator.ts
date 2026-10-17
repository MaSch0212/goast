import { type AppendValueGroup, appendValueGroup, type MaybePromise } from '@goast/core';

import { go } from '../../ast/index.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import { toGoFileName } from '../../utils.ts';
import { GoFileGenerator } from '../file-generator.ts';
import type { DefaultGoClientGeneratorArgs as Args } from './index.ts';
import type { GoClientGeneratorContext, GoClientGeneratorOutput } from './models.ts';

type Context = GoClientGeneratorContext;
type Output = GoClientGeneratorOutput;
type Builder = GoFileBuilder;

/**
 * Generates the client code of one service. Implement it to replace the generation of a service's client code.
 * @template TOutput The type of the result, which describes the file that was written.
 * @see DefaultGoClientGenerator
 */
export interface GoClientGenerator<TOutput extends Output = Output> {
  /**
   * Writes the client file of the service and describes it.
   * @param ctx The context of the service to generate.
   * @returns The output that describes the written file, or a promise that resolves to it.
   */
  generate(ctx: Context): MaybePromise<TOutput>;
}

/**
 * The default generator of the client code of one service (tag). It writes a single Go file into the package directory
 * of the service, named after the service with a `_client.go` suffix. The file declares a `<Name>Client` type with a
 * method per operation and a `New<Name>Client` constructor. Each part is built by a protected method, so subclasses can
 * change one part at a time.
 * @see GoClientGenerator
 */
export class DefaultGoClientGenerator extends GoFileGenerator<Context, Output> implements GoClientGenerator {
  /**
   * Writes the client file of the service, and returns references to its client type and constructor.
   * @param ctx The context of the service to generate.
   * @returns The references to the client type as `client`, and to the constructor as `constructor`.
   */
  public generate(ctx: Context): MaybePromise<Output> {
    const pkg = ctx.package;
    const registry = this.getIdentifierRegistry(ctx, pkg);
    const serviceName = this.toExportedName(ctx, ctx.service.name, 'Default');
    const clientName = registry.reserve(`${serviceName}Client`, `client:${ctx.service.id}`);
    const constructorName = registry.reserve(`New${clientName}`, `client-constructor:${ctx.service.id}`);

    const files = this.getIdentifierRegistry(ctx, { ...pkg, importPath: `${pkg.importPath}\u0000files` });
    const fileName = `${files.reserve(toGoFileName(`${ctx.service.name}_client`).replace(/\.go$/, ''), `client:${ctx.service.id}`)}.go`;
    const filePath = `${pkg.dir}/${fileName}`;

    console.log(`Generating client ${ctx.service.id} [${clientName}] to ${filePath}...`);

    const builder = new GoFileBuilder(pkg.name, pkg.importPath, ctx.config);
    builder.append(this.getFileContent(ctx, { clientName }));
    builder.writeToFile(filePath);

    return {
      client: go.reference(clientName, pkg.importPath, { packageName: pkg.name }),
      constructor: go.reference(constructorName, pkg.importPath, { packageName: pkg.name }),
    };
  }

  /**
   * Builds the content of the client file: the client type.
   * @param ctx The context of the service to generate.
   * @param args The name of the client type.
   * @returns The content of the file.
   */
  protected getFileContent(ctx: Context, args: Args.GetFileContent): AppendValueGroup<Builder> {
    return appendValueGroup<Builder>(
      [
        go.typeDeclaration(args.clientName, go.struct([go.field('c', go.pointer(ctx.runtimeNames.client))]), {
          doc: go.doc(`${args.clientName} calls the operations of the API.`),
        }),
      ],
      '\n',
    );
  }
}
