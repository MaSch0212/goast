import {
  AppendValue,
  AstNodeOptions,
  BasicAppendValue,
  Nullable,
  Prettify,
  SourceBuilder,
  notNullish,
} from '@goast/core';

import { TsDecorator, tsDecorator } from './decorator';
import { TsDoc, tsDoc } from './doc';
import { TsGenericParameter, tsGenericParameter } from './generic-parameter';
import { TsParameter, tsParameter } from './parameter';
import { TsType } from './types';
import { TsAccessModifier } from '../common';
import { TsNode } from '../node';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes';

type Injects = 'doc' | 'decorators' | 'modifiers' | 'name' | 'generics' | 'params' | 'returnType' | 'body';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<TsDoc<TBuilder>>;
    decorators?: Nullable<Nullable<TsDecorator<TBuilder>>[]>;
    accessModifier?: Nullable<TsAccessModifier>;
    static?: Nullable<boolean>;
    abstract?: Nullable<boolean>;
    override?: Nullable<boolean>;
    name: string;
    optional?: Nullable<boolean>;
    generics?: Nullable<Nullable<TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    parameters?: Nullable<Nullable<TsParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    returnType?: Nullable<TsType<TBuilder>>;
    body?: Nullable<AppendValue<TBuilder>>;
  }
>;

export class TsMethod<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public doc: TsDoc<TBuilder> | null;
  public decorators: TsDecorator<TBuilder>[];
  public accessModifier: TsAccessModifier | null;
  public static: boolean;
  public abstract: boolean;
  public override: boolean;
  public name: string;
  public optional: boolean;
  public generics: (TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public parameters: (TsParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public returnType: TsType<TBuilder> | null;
  public body: AppendValue<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.decorators = options.decorators?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.static = options.static ?? false;
    this.abstract = options.abstract ?? false;
    this.override = options.override ?? false;
    this.name = options.name;
    this.optional = options.optional ?? false;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.returnType = options.returnType ?? null;
    this.body = options.body ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    tsDoc.write(builder, tsDoc.get(this.doc, { generics: this.generics, parameters: this.parameters }));
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeDecorators);
    tsDecorator.write(builder, this.decorators, { multiline: true });
    builder.append(this.inject.afterDecorators);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.static) builder.append('static ');
    if (this.abstract) builder.append('abstract ');
    if (this.override) builder.append('override ');
    builder.append(this.inject.afterModifiers);

    builder.append(this.inject.beforeName, this.name, this.inject.afterName);
    if (this.optional) builder.append('?');

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

    if (this.body) {
      builder.append(' ');
      builder.append(this.inject.beforeBody);
      builder.parenthesize('{}', this.body, { multiline: !!this.body });
      builder.append(this.inject.afterBody);
    } else {
      builder.append(';');
    }

    builder.appendLine();
  }
}

export const createMethod = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
) => new TsMethod<TBuilder>({ ...options, name });

export const tsMethod = Object.assign(createMethod, {
  write: writeTsNodes,
});
