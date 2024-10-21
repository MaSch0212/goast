import {
  type AppendValue,
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { type TsDecorator, tsDecorator } from './decorator.ts';
import { type TsDoc, tsDoc } from './doc.ts';
import { type TsGenericParameter, tsGenericParameter } from './generic-parameter.ts';
import { type TsParameter, tsParameter } from './parameter.ts';
import type { TsType } from './types.ts';
import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';

type Injects = 'doc' | 'decorators' | 'modifiers' | 'name' | 'generics' | 'params' | 'returnType' | 'body';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<TsDoc<TBuilder>>;
    decorators?: Nullable<Nullable<TsDecorator<TBuilder>>[]>;
    export?: boolean;
    name: string;
    generics?: Nullable<Nullable<TsGenericParameter<TBuilder>>[]>;
    parameters?: Nullable<Nullable<TsParameter<TBuilder>>[]>;
    returnType?: Nullable<TsType<TBuilder>>;
    body?: Nullable<AppendValue<TBuilder>>;
  }
>;

export class TsFunction<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public doc: TsDoc<TBuilder> | null;
  public decorators: TsDecorator<TBuilder>[];
  public export: boolean;
  public name: string;
  public generics: TsGenericParameter<TBuilder>[];
  public parameters: TsParameter<TBuilder>[];
  public returnType: TsType<TBuilder> | null;
  public body: AppendValue<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.decorators = options.decorators?.filter(notNullish) ?? [];
    this.export = options.export ?? false;
    this.name = options.name;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.returnType = options.returnType ?? null;
    this.body = options.body ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    tsDoc.write(builder, tsDoc.get(this.doc, { generics: this.generics }));
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeDecorators);
    tsDecorator.write(builder, this.decorators, { multiline: true });
    builder.append(this.inject.afterDecorators);

    builder.append(this.inject.beforeModifiers);
    if (this.export) builder.append('export ');
    builder.append(this.inject.afterModifiers);

    builder.append('function ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

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

    builder.append(' ');

    builder.append(this.inject.beforeBody);
    builder.parenthesize('{}', this.body, { multiline: !!this.body });
    builder.append(this.inject.afterBody);

    builder.appendLine();
  }
}

const createFunction = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
) => new TsFunction<TBuilder>({ ...options, name });

export const tsFunction = Object.assign(createFunction, {
  write: writeTsNodes,
});
