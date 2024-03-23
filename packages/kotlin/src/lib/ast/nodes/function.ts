import { SourceBuilder, AstNodeOptions, AppendValue, Prettify, SingleOrMultiple, toArray } from '@goast/core';

import { ktAnnotation, KtAnnotation } from './annotation';
import { KtDoc } from './doc';
import { ktGenericParameter, KtGenericParameter } from './generic-parameter';
import { ktParameter, KtParameter } from './parameter';
import { KtReference } from './reference';
import { KotlinFileBuilder } from '../../file-builder';
import { KtAccessModifier } from '../common';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type KtFunctionOptions<TBuilder extends SourceBuilder = KotlinFileBuilder> = AstNodeOptions<
  KtFunction<TBuilder>,
  typeof KtNode<TBuilder>,
  'name'
>;

type KtFunctionInjects =
  | 'beforeDoc'
  | 'afterDoc'
  | 'beforeAnnotations'
  | 'afterAnnotations'
  | 'beforeKeywords'
  | 'afterKeywords'
  | 'beforeGenerics'
  | 'afterGenerics'
  | 'beforeReceiverAnnotations'
  | 'afterReceiverAnnotations'
  | 'beforeReceiverType'
  | 'afterReceiverType'
  | 'beforeName'
  | 'afterName'
  | 'beforeParameters'
  | 'afterParameters'
  | 'beforeReturnType'
  | 'afterReturnType';

export class KtFunction<
  TBuilder extends SourceBuilder = KotlinFileBuilder,
  TInjects extends string = never
> extends KtNode<TBuilder, KtFunctionInjects | TInjects> {
  public name: string;
  public generics: KtGenericParameter<TBuilder>[];
  public parameters: KtParameter<TBuilder>[];
  public doc: KtDoc<TBuilder> | null;
  public returnType: AppendValue<TBuilder>;
  public body: AppendValue<TBuilder>;
  public accessModifier: KtAccessModifier;
  public annotations: KtAnnotation<TBuilder>[];
  public receiverType: KtReference<TBuilder> | AppendValue<TBuilder>;
  public receiverAnnotations: KtAnnotation<TBuilder>[];
  public singleExpression: boolean;
  public open: boolean;
  public inline: boolean;
  public infix: boolean;
  public tailrec: boolean;
  public operator: boolean;
  public override: boolean;
  public abstract: boolean;

  constructor(options: KtFunctionOptions<TBuilder>) {
    super(options);
    this.name = options.name;
    this.generics = options.generics ?? [];
    this.parameters = options.parameters ?? [];
    this.doc = options.doc ?? null;
    this.returnType = options.returnType ?? null;
    this.body = options.body ?? null;
    this.accessModifier = options.accessModifier ?? null;
    this.annotations = options.annotations ?? [];
    this.receiverType = options.receiverType ?? null;
    this.receiverAnnotations = options.receiverAnnotations ?? [];
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
        ' '
      )
      .appendIf(
        !!this.receiverType,
        this.inject.beforeReceiverAnnotations,
        (b) => ktAnnotation.write(b, this.receiverAnnotations, { multiline: false }),
        this.inject.afterReceiverAnnotations,
        this.inject.beforeReceiverType,
        (b) => writeKt(b, this.receiverType),
        this.inject.afterReceiverType,
        '.'
      )
      .append(
        this.inject.beforeName,
        this.name,
        this.inject.afterName,
        this.inject.beforeParameters,
        (b) => ktParameter.write(b, this.parameters),
        this.inject.afterParameters
      )
      .appendIf(!!this.returnType, ': ', this.inject.beforeReturnType, this.returnType, this.inject.afterReturnType)
      .if(!this.abstract, (b) =>
        b
          .append(' ')
          .appendIf(this.singleExpression && !!this.body, '= ')
          .parenthesizeIf(!this.singleExpression || !this.body, '{}', this.body, {
            multiline: !!this.body,
            indent: true,
          })
      );
  }
}

const createFunction = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  name: KtFunction<TBuilder>['name'],
  options?: Prettify<Omit<KtFunctionOptions<TBuilder>, 'name'>>
) => new KtFunction<TBuilder>({ ...options, name });

const writeFunctions = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<KtFunction<TBuilder> | AppendValue<TBuilder>>
) => {
  builder.forEach(toArray(nodes), writeKt, { separator: '\n' });
};

export const ktFunction = Object.assign(createFunction, {
  write: writeFunctions,
});
