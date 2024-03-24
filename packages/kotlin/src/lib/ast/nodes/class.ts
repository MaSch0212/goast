import {
  AppendValue,
  AstNodeOptions,
  Nullable,
  Prettify,
  SingleOrMultiple,
  SourceBuilder,
  notNullish,
  toArray,
} from '@goast/core';

import { ktAnnotation, KtAnnotation } from './annotation';
import { ktArgument } from './argument';
import { KtConstructor } from './constructor';
import { ktDoc, KtDoc } from './doc';
import { KtEnum } from './enum';
import { KtFunction } from './function';
import { ktGenericParameter, KtGenericParameter } from './generic-parameter';
import { ktInitBlock, KtInitBlock } from './init-block';
import { KtInterface } from './interface';
import { KtObject } from './object';
import { KtProperty } from './property';
import { KtReference } from './reference';
import { KtAccessModifier } from '../common';
import { KtNode } from '../node';
import { writeKt, writeKtMembers } from '../utils';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<KtDoc<TBuilder>>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    accessModifier?: Nullable<KtAccessModifier>;
    open?: Nullable<boolean>;
    abstract?: Nullable<boolean>;
    classKind?: Nullable<ClassKind>;
    name: string;
    generics?: Nullable<Nullable<KtGenericParameter<TBuilder>>[]>;
    primaryConstructor?: Nullable<KtConstructor<TBuilder>>;
    extends?: Nullable<KtReference<TBuilder> | AppendValue<TBuilder>>;
    implements?: Nullable<Nullable<KtReference<TBuilder> | AppendValue<TBuilder>>[]>;
    members?: Nullable<Nullable<Member<TBuilder>>[]>;
    companionObject?: Nullable<KtObject<TBuilder>>;
  }
>;

type ClassKind = 'data' | 'value' | 'annotation' | 'sealed';
type Member<TBuilder extends SourceBuilder> =
  | KtConstructor<TBuilder>
  | KtEnum<TBuilder>
  | KtInitBlock<TBuilder>
  | KtInterface<TBuilder>
  | KtProperty<TBuilder>
  | KtFunction<TBuilder>
  | KtClass<TBuilder>
  | AppendValue<TBuilder>;

export class KtClass<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public doc: KtDoc<TBuilder> | null;
  public annotations: KtAnnotation<TBuilder>[];
  public accessModifier: KtAccessModifier | null;
  public open: boolean;
  public abstract: boolean;
  public classKind: ClassKind | null;
  public name: string;
  public generics: KtGenericParameter<TBuilder>[];
  public primaryConstructor: KtConstructor<TBuilder> | null;
  public extends: KtReference<TBuilder> | AppendValue<TBuilder> | null;
  public implements: (KtReference<TBuilder> | AppendValue<TBuilder>)[];
  public members: Member<TBuilder>[];
  public companionObject: Nullable<KtObject<TBuilder>>;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.open = options.open ?? false;
    this.abstract = options.abstract ?? false;
    this.classKind = options.classKind ?? null;
    this.name = options.name;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.primaryConstructor = options.primaryConstructor ?? null;
    this.extends = options.extends ?? null;
    this.implements = options.implements?.filter(notNullish) ?? [];
    this.members = options.members?.filter(notNullish) ?? [];
    this.companionObject = options.companionObject;
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .append((b) =>
        ktDoc.get(this.doc, { generics: this.generics, parameters: this.primaryConstructor?.parameters })?.write(b),
      )
      .append((b) => ktAnnotation.write(b, this.annotations, { multiline: true }))
      .appendIf(!!this.accessModifier, this.accessModifier, ' ')
      .appendIf(this.open, 'open ')
      .appendIf(this.abstract, 'abstract ')
      .appendIf(!!this.classKind, this.classKind, ' ')
      .append('class ', this.name, (b) => ktGenericParameter.write(b, this.generics))
      .append((b) => this.primaryConstructor?.writeAsPrimary(b))
      .appendIf(!!this.extends || this.implements.length > 0, ' : ')
      .append((b) => writeKt(b, this.extends))
      .appendIf(!!this.extends && this.primaryConstructor?.delegateTarget === 'super', (b) =>
        ktArgument.write(b, this.primaryConstructor?.delegateArguments),
      )
      .appendIf(!!this.extends && this.implements.length > 0, ', ')
      .forEach(this.implements, (b, i) => writeKt(b, i), { separator: ', ' })
      .if(this.members.some(notNullish) || !!this.primaryConstructor?.body || !!this.companionObject, (b) =>
        b.append(' ').parenthesize(
          '{}',
          (b) =>
            writeKtMembers(b, [
              this.primaryConstructor?.body ? ktInitBlock(this.primaryConstructor?.body) : null,
              ...this.members,
              this.companionObject
                ? (b) =>
                    b
                      .if(!!this.primaryConstructor?.body || this.members.some(notNullish), (b) =>
                        b.ensurePreviousLineEmpty(),
                      )
                      .append('companion ')
                      .append((b) => this.companionObject?.write(b))
                : null,
            ]),
          { multiline: true },
        ),
      )
      .appendLine();
  }
}

const createClass = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
) => new KtClass<TBuilder>({ ...options, name });

const writeClasses = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtClass<TBuilder> | AppendValue<TBuilder>>>,
) => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, writeKt, { separator: '\n' });
};

export const ktClass = Object.assign(createClass, {
  write: writeClasses,
});
