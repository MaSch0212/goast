import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    keyName?: Nullable<string>;
    keyType: TsType<TBuilder>;
    valueType: TsType<TBuilder>;
    readonly?: Nullable<boolean>;
  }
>;

export class TsIndexer<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public keyName: string;
  public keyType: TsType<TBuilder>;
  public valueType: TsType<TBuilder>;
  public readonly: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.keyName = options.keyName ?? 'key';
    this.keyType = options.keyType;
    this.valueType = options.valueType;
    this.readonly = options.readonly ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.readonly) builder.append('readonly ');

    builder.parenthesize('[]', (b) => {
      b.append(this.keyName, ': ');
      writeTsNode(b, this.keyType);
    });

    builder.append(': ');
    writeTsNode(builder, this.valueType);
    builder.append(';');

    builder.appendLine();
  }
}

const createIndexer = <TBuilder extends SourceBuilder>(
  keyType: Options<TBuilder>['keyType'],
  valueType: Options<TBuilder>['valueType'],
  options?: Prettify<Omit<Options<TBuilder>, 'keyType' | 'valueType'>>,
): TsIndexer<TBuilder> => new TsIndexer<TBuilder>({ ...options, keyType, valueType });

export const tsIndexer: typeof createIndexer & { write: typeof writeTsNodes } = Object.assign(createIndexer, {
  write: writeTsNodes,
});
