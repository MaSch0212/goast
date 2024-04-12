import { AstNodeOptions, Prettify, SourceBuilder } from '@goast/core';

import { TypeScriptFileBuilder } from '../../file-builder';
import { TsNode } from '../node';
import { writeTsNodes } from '../utils/write-ts-nodes';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    filePath: string;
  }
>;

export class TsExport<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public filePath: string;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.filePath = options.filePath;
  }

  protected override onWrite(builder: TBuilder): void {
    if (builder instanceof TypeScriptFileBuilder) {
      builder.addExport(this.name, this.filePath);
    } else {
      builder.appendLine(`export { ${this.name} } from '${this.filePath}';`);
    }
  }
}

export const createExport = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  filePath: Options<TBuilder>['filePath'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'filePath'>>,
) => new TsExport<TBuilder>({ ...options, name, filePath });

export const tsExport = Object.assign(createExport, {
  write: writeTsNodes,
});
