import { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { TsDoc } from './doc';
import { TsType, TsValue } from './types';
import { TsNode } from '../node';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    doc?: Nullable<TsDoc<TBuilder>>;
    type?: Nullable<TsType<TBuilder>>;
    value?: Nullable<TsValue<TBuilder>>;
    export?: Nullable<boolean>;
    readonly?: Nullable<boolean>;
  }
>;

export class TsVariable<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public doc: TsDoc<TBuilder> | null;
  public type: TsType<TBuilder> | null;
  public value: TsValue<TBuilder> | null;
  public export: boolean;
  public readonly: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.type = options.type ?? null;
    this.value = options.value ?? null;
    this.export = options.export ?? false;
    this.readonly = options.readonly ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.doc) writeTsNode(builder, this.doc);
    if (this.export) builder.append('export ');

    builder.append(this.readonly ? 'const ' : 'let ');
    builder.append(this.name);

    if (this.type) {
      builder.append(': ');
      writeTsNode(builder, this.type);
    }

    if (this.value) {
      builder.append(' = ');
      writeTsNode(builder, this.value);
    }

    builder.append(';');

    builder.appendLine();
  }
}

const createVariable = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
) => new TsVariable<TBuilder>({ ...options, name });

export const tsVariable = Object.assign(createVariable, {
  write: writeTsNodes,
});
