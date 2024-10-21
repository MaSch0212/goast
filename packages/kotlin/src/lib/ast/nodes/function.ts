import {
  type AppendValue,
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { type KtAnnotation, ktAnnotation } from './annotation.ts';
import { type KtDoc, ktDoc } from './doc.ts';
import { type KtGenericParameter, ktGenericParameter } from './generic-parameter.ts';
import { type KtParameter, ktParameter } from './parameter.ts';
import type { KtType } from './types.ts';
import type { KtAccessModifier } from '../common.ts';
import { KtNode } from '../node.ts';
import { writeKtNode, writeKtNodes } from '../utils/write-kt-node.ts';

type Injects =
  | 'doc'
  | 'annotations'
  | 'modifiers'
  | 'generics'
  | 'receiverAnnotations'
  | 'receiverType'
  | 'name'
  | 'parameters'
  | 'returnType';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    generics?: Nullable<Nullable<KtGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    parameters?: Nullable<Nullable<KtParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    doc?: Nullable<KtDoc<TBuilder>>;
    returnType?: Nullable<KtType<TBuilder>>;
    body?: Nullable<AppendValue<TBuilder>>;
    accessModifier?: Nullable<KtAccessModifier>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    receiverType?: Nullable<KtType<TBuilder>>;
    receiverAnnotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    singleExpression?: Nullable<boolean>;
    open?: Nullable<boolean>;
    inline?: Nullable<boolean>;
    infix?: Nullable<boolean>;
    tailrec?: Nullable<boolean>;
    suspend?: Nullable<boolean>;
    operator?: Nullable<boolean>;
    override?: Nullable<boolean>;
    abstract?: Nullable<boolean>;
  }
>;

export class KtFunction<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public generics: (KtGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public parameters: (KtParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public doc: KtDoc<TBuilder> | null;
  public returnType: KtType<TBuilder> | null;
  public body: AppendValue<TBuilder> | null;
  public accessModifier: KtAccessModifier | null;
  public annotations: KtAnnotation<TBuilder>[];
  public receiverType: KtType<TBuilder> | null;
  public receiverAnnotations: KtAnnotation<TBuilder>[];
  public singleExpression: boolean;
  public open: boolean;
  public inline: boolean;
  public infix: boolean;
  public tailrec: boolean;
  public suspend: boolean;
  public operator: boolean;
  public override: boolean;
  public abstract: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.doc = options.doc ?? null;
    this.returnType = options.returnType ?? null;
    this.body = options.body ?? null;
    this.accessModifier = options.accessModifier ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.receiverType = options.receiverType ?? null;
    this.receiverAnnotations = options.receiverAnnotations?.filter(notNullish) ?? [];
    this.singleExpression = options.singleExpression ?? false;
    this.open = options.open ?? false;
    this.inline = options.inline ?? false;
    this.infix = options.infix ?? false;
    this.tailrec = options.tailrec ?? false;
    this.suspend = options.suspend ?? false;
    this.operator = options.operator ?? false;
    this.override = options.override ?? false;
    this.abstract = options.abstract ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    ktDoc.get(this.doc, { generics: this.generics, parameters: this.parameters })?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations, { multiline: true });
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.inline) builder.append('inline ');
    if (this.infix) builder.append('infix ');
    if (this.tailrec) builder.append('tailrec ');
    if (this.suspend) builder.append('suspend ');
    if (this.open) builder.append('open ');
    if (this.override) builder.append('override ');
    if (this.abstract) builder.append('abstract ');
    if (this.operator) builder.append('operator ');
    builder.append(this.inject.afterModifiers);

    builder.append('fun ');

    builder.append(this.inject.beforeGenerics);
    ktGenericParameter.write(builder, this.generics);
    builder.append(this.inject.afterGenerics);
    if (this.generics.length > 0) builder.append(' ');

    if (this.receiverType) {
      builder.append(this.inject.beforeReceiverAnnotations);
      ktAnnotation.write(builder, this.receiverAnnotations, { multiline: false });
      builder.append(this.inject.afterReceiverAnnotations);

      builder.append(this.inject.beforeReceiverType);
      writeKtNode(builder, this.receiverType);
      builder.append(this.inject.afterReceiverType);
      builder.append('.');
    }

    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    builder.append(this.inject.beforeParameters);
    ktParameter.write(builder, this.parameters);
    builder.append(this.inject.afterParameters);

    if (this.returnType) {
      builder.append(': ');
      builder.append(this.inject.beforeReturnType);
      writeKtNode(builder, this.returnType);
      builder.append(this.inject.afterReturnType);
    }

    if (!this.abstract) {
      builder.append(' ');
      if (this.singleExpression && this.body) {
        builder.append('= ');
        builder.indent(this.body);
      } else {
        builder.parenthesize('{}', this.body, { multiline: !!this.body });
      }
    }

    builder.appendLine();
  }
}

const createFunction = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
) => new KtFunction<TBuilder>({ ...options, name });

export const ktFunction = Object.assign(createFunction, {
  write: writeKtNodes,
});
