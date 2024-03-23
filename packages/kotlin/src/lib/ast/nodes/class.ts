import {
  AppendValue,
  AstNodeOptions,
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
import { KotlinFileBuilder } from '../../file-builder';
import { KtAccessModifier } from '../common';
import { KtNode } from '../node';
import { writeKt, writeKtMembers } from '../utils';

type KtClassOptions<TBuilder extends SourceBuilder> = AstNodeOptions<
  KtClass<TBuilder>,
  typeof KtNode<TBuilder>,
  'name'
>;

export class KtClass<
  TBuilder extends SourceBuilder = KotlinFileBuilder,
  TInjects extends string = never
> extends KtNode<TBuilder, TInjects> {
  public doc: KtDoc<TBuilder> | null;
  public annotations: KtAnnotation<TBuilder>[];
  public accessModifier: KtAccessModifier;
  public open: boolean;
  public abstract: boolean;
  public classKind: 'data' | 'value' | 'annotation' | 'sealed' | null;
  public name: string;
  public generics: KtGenericParameter<TBuilder>[];
  public primaryConstructor: KtConstructor<TBuilder> | null;
  public extends: KtReference<TBuilder> | AppendValue<TBuilder>;
  public implements: (KtReference<TBuilder> | AppendValue<TBuilder>)[];
  public members: (
    | KtConstructor<TBuilder>
    | KtEnum<TBuilder>
    | KtInitBlock<TBuilder>
    | KtInterface<TBuilder>
    | KtProperty<TBuilder>
    | KtFunction<TBuilder>
    | KtClass<TBuilder>
    | AppendValue<TBuilder>
  )[];
  public companionObject: KtObject<TBuilder> | null;

  constructor(options: KtClassOptions<TBuilder>) {
    super(options);
    this.doc = options.doc ?? null;
    this.annotations = options.annotations ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.open = options.open ?? false;
    this.abstract = options.abstract ?? false;
    this.classKind = options.classKind ?? null;
    this.name = options.name;
    this.generics = options.generics ?? [];
    this.primaryConstructor = options.primaryConstructor ?? null;
    this.extends = options.extends ?? null;
    this.implements = options.implements ?? [];
    this.members = options.members ?? [];
    this.companionObject = options.companionObject ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .append((b) =>
        ktDoc.get(this.doc, { generics: this.generics, parameters: this.primaryConstructor?.parameters })?.write(b)
      )
      .append((b) => ktAnnotation.write(b, this.annotations, { multiline: true }))
      .appendIf(!!this.accessModifier, this.accessModifier, ' ')
      .appendIf(this.open, 'open ')
      .appendIf(this.abstract, 'abstract ')
      .appendIf(!!this.classKind, this.classKind, ' ')
      .append('class ', this.name, (b) => ktGenericParameter.write(b, this.generics))
      .append((b) => this.primaryConstructor?.writeAsPrimary(b))
      .appendIf(!!this.extends || this.implements.length > 0, ' : ')
      .appendIf(
        !!this.extends,
        (b) => writeKt(b, this.extends),
        (b) =>
          b.appendIf(this.primaryConstructor?.delegateTarget === 'super', (b) =>
            ktArgument.write(b, this.primaryConstructor?.delegateArguments)
          )
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
                        b.ensurePreviousLineEmpty()
                      )
                      .append('companion ')
                      .append((b) => this.companionObject?.write(b))
                : null,
            ]),
          { multiline: true }
        )
      )
      .appendLine();
  }
}

const createClass = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  name: KtClass<TBuilder>['name'],
  options?: Prettify<Omit<KtClassOptions<TBuilder>, 'name'>>
) => new KtClass<TBuilder>({ ...options, name });

const writeClasses = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  builder: TBuilder,
  classes: SingleOrMultiple<KtClass<TBuilder> | AppendValue<TBuilder>>
) => {
  builder.forEach(toArray(classes), writeKt, { separator: '\n' });
};

export const ktClass = Object.assign(createClass, {
  write: writeClasses,
});
