import {
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsDoc } from './doc.ts';
import { type TsGenericParameter, tsGenericParameter } from './generic-parameter.ts';
import type { TsType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    doc?: Nullable<TsDoc<TBuilder>>;
    generics?: Nullable<Nullable<TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    type: TsType<TBuilder>;
    export?: Nullable<boolean>;
  }
>;

export class TsTypeAlias<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public doc: TsDoc<TBuilder> | null;
  public generics: (TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public type: TsType<TBuilder>;
  public export: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.type = options.type;
    this.export = options.export ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.doc) writeTsNode(builder, this.doc);
    if (this.export) builder.append('export ');

    builder.append('type ');
    builder.append(this.name);
    tsGenericParameter.write(builder, this.generics);

    builder.append(' = ');
    builder.indent((b) => {
      writeTsNode(b, this.type);
    });

    builder.append(';');

    builder.appendLine();
  }
}

const createTypeAlias = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  type: Options<TBuilder>['type'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'type'>>,
) => new TsTypeAlias<TBuilder>({ ...options, name, type });

export const tsTypeAlias = Object.assign(createTypeAlias, {
  write: writeTsNodes,
});
