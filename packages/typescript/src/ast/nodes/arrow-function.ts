import {
  type AppendValue,
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type SourceBuilder,
} from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import { type TsGenericParameter, tsGenericParameter } from './generic-parameter.ts';
import { type TsParameter, tsParameter } from './parameter.ts';
import type { TsType } from './types.ts';

type Injects = 'generics' | 'params' | 'returnType' | 'body';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    async?: Nullable<boolean>;
    generics?: Nullable<Nullable<TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    parameters?: Nullable<Nullable<TsParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    returnType?: Nullable<TsType<TBuilder>>;
    singleExpression?: Nullable<boolean>;
    body?: Nullable<AppendValue<TBuilder>>;
  }
>;

export class TsArrowFunction<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public async: boolean;
  public generics: (TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public parameters: (TsParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public returnType: TsType<TBuilder> | null;
  public singleExpression: boolean;
  public body: AppendValue<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.async = options.async ?? false;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.returnType = options.returnType ?? null;
    this.singleExpression = options.singleExpression ?? false;
    this.body = options.body ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.async) {
      builder.append('async ');
    }

    builder.append(this.inject.beforeGenerics);
    tsGenericParameter.write(builder, this.generics);
    builder.append(this.inject.afterGenerics);

    builder.append(this.inject.beforeParams);
    tsParameter.write(builder, this.parameters);
    builder.append(this.inject.afterParams);

    if (this.returnType) {
      builder.append(': ');
      builder.append(this.inject.beforeReturnType);
      writeTsNode(builder, this.returnType);
      builder.append(this.inject.afterReturnType);
    }

    builder.append(' => ');

    builder.append(this.inject.beforeBody);
    if (this.singleExpression && this.body) {
      builder.append(this.body);
    } else {
      builder.parenthesize('{}', this.body, { multiline: !!this.body });
    }
    builder.append(this.inject.afterBody);
  }
}

const createArrowFunction = <TBuilder extends SourceBuilder>(options?: Options<TBuilder>): TsArrowFunction<TBuilder> =>
  new TsArrowFunction<TBuilder>(options ?? {});

export const tsArrowFunction: typeof createArrowFunction & { write: typeof writeTsNodes } = Object.assign(
  createArrowFunction,
  {
    write: writeTsNodes,
  },
);
