import { AppendValue, AstNodeOptions, BasicAppendValue, Nullable, SourceBuilder, notNullish } from '@goast/core';

import { TsGenericParameter, tsGenericParameter } from './generic-parameter';
import { TsParameter, tsParameter } from './parameter';
import { TsType } from './types';
import { TsNode } from '../node';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes';

type Injects = 'generics' | 'params' | 'returnType' | 'body';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
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
  public generics: (TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public parameters: (TsParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public returnType: TsType<TBuilder> | null;
  public singleExpression: boolean;
  public body: AppendValue<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.returnType = options.returnType ?? null;
    this.singleExpression = options.singleExpression ?? false;
    this.body = options.body ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
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

const createArrowFunction = <TBuilder extends SourceBuilder>(options?: Options<TBuilder>) =>
  new TsArrowFunction<TBuilder>(options ?? {});

export const tsArrowFunction = Object.assign(createArrowFunction, {
  write: writeTsNodes,
});
