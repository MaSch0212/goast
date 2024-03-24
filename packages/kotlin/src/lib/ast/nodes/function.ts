import {
  SourceBuilder,
  AstNodeOptions,
  AppendValue,
  Prettify,
  SingleOrMultiple,
  toArray,
  Nullable,
  notNullish,
} from '@goast/core';

import { ktAnnotation, KtAnnotation } from './annotation';
import { KtDoc } from './doc';
import { ktGenericParameter, KtGenericParameter } from './generic-parameter';
import { ktParameter, KtParameter } from './parameter';
import { KtReference } from './reference';
import { KtAccessModifier } from '../common';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type Injects =
  | 'doc'
  | 'annotations'
  | 'keywords'
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
    generics?: Nullable<Nullable<KtGenericParameter<TBuilder>>[]>;
    parameters?: Nullable<Nullable<KtParameter<TBuilder>>[]>;
    doc?: Nullable<KtDoc<TBuilder>>;
    returnType?: Nullable<AppendValue<TBuilder> | KtReference<TBuilder>>;
    body?: Nullable<AppendValue<TBuilder>>;
    accessModifier?: Nullable<KtAccessModifier>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    receiverType?: Nullable<KtReference<TBuilder> | AppendValue<TBuilder>>;
    receiverAnnotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    singleExpression?: Nullable<boolean>;
    open?: Nullable<boolean>;
    inline?: Nullable<boolean>;
    infix?: Nullable<boolean>;
    tailrec?: Nullable<boolean>;
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
  public generics: KtGenericParameter<TBuilder>[];
  public parameters: KtParameter<TBuilder>[];
  public doc: KtDoc<TBuilder> | null;
  public returnType: AppendValue<TBuilder> | KtReference<TBuilder> | null;
  public body: AppendValue<TBuilder> | null;
  public accessModifier: KtAccessModifier | null;
  public annotations: KtAnnotation<TBuilder>[];
  public receiverType: KtReference<TBuilder> | AppendValue<TBuilder> | null;
  public receiverAnnotations: KtAnnotation<TBuilder>[];
  public singleExpression: boolean;
  public open: boolean;
  public inline: boolean;
  public infix: boolean;
  public tailrec: boolean;
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
    this.operator = options.operator ?? false;
    this.override = options.override ?? false;
    this.abstract = options.abstract ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .append(this.inject.beforeDoc)
      .append((b) => this.doc?.write(b))
      .append(this.inject.afterDoc)
      .append(this.inject.beforeAnnotations)
      .append((b) => ktAnnotation.write(b, this.annotations, { multiline: true }))
      .append(this.inject.afterAnnotations)
      .appendIf(!!this.accessModifier, this.accessModifier, ' ')
      .append(this.inject.beforeKeywords)
      .appendIf(this.inline, 'inline ')
      .appendIf(this.infix, 'infix ')
      .appendIf(this.tailrec, 'tailrec ')
      .appendIf(this.open, 'open ')
      .appendIf(this.override, 'override ')
      .appendIf(this.abstract, 'abstract ')
      .appendIf(this.operator, 'operator ')
      .append(this.inject.afterKeywords)
      .append('fun ')
      .appendIf(
        this.generics.length > 0,
        this.inject.beforeGenerics,
        (b) => ktGenericParameter.write(b, this.generics),
        this.inject.afterGenerics,
        ' ',
      )
      .appendIf(
        !!this.receiverType,
        this.inject.beforeReceiverAnnotations,
        (b) => ktAnnotation.write(b, this.receiverAnnotations, { multiline: false }),
        this.inject.afterReceiverAnnotations,
        this.inject.beforeReceiverType,
        (b) => writeKt(b, this.receiverType),
        this.inject.afterReceiverType,
        '.',
      )
      .append(
        this.inject.beforeName,
        this.name,
        this.inject.afterName,
        this.inject.beforeParameters,
        (b) => ktParameter.write(b, this.parameters),
        this.inject.afterParameters,
      )
      .appendIf(
        !!this.returnType,
        ': ',
        this.inject.beforeReturnType,
        (b) => writeKt(b, this.returnType),
        this.inject.afterReturnType,
      )
      .if(!this.abstract, (b) =>
        b
          .append(' ')
          .appendIf(this.singleExpression && !!this.body, '= ')
          .parenthesizeIf(!this.singleExpression || !this.body, '{}', this.body, {
            multiline: !!this.body,
            indent: true,
          }),
      );
  }
}

const createFunction = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
) => new KtFunction<TBuilder>({ ...options, name });

const writeFunctions = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtFunction<TBuilder> | AppendValue<TBuilder>>>,
) => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, writeKt, { separator: '\n' });
};

export const ktFunction = Object.assign(createFunction, {
  write: writeFunctions,
});
