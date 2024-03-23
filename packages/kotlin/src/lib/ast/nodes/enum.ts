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
import { KtClass } from './class';
import { KtConstructor } from './constructor';
import { ktDoc, KtDoc } from './doc';
import { ktEnumValue, KtEnumValue } from './enum-value';
import { KtFunction } from './function';
import { ktInitBlock, KtInitBlock } from './init-block';
import { KtInterface } from './interface';
import { KtObject } from './object';
import { KtProperty } from './property';
import { KtReference } from './reference';
import { KotlinFileBuilder } from '../../file-builder';
import { KtAccessModifier } from '../common';
import { KtNode } from '../node';
import { writeKt, writeKtMembers } from '../utils';

type KtEnumOptions<TBuilder extends SourceBuilder> = AstNodeOptions<KtEnum<TBuilder>, typeof KtNode<TBuilder>, 'name'>;

export class KtEnum<TBuilder extends SourceBuilder = KotlinFileBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects
> {
  public name: string;
  public doc: KtDoc<TBuilder> | null;
  public annotations: KtAnnotation<TBuilder>[];
  public accessModifier: KtAccessModifier;
  public primaryConstructor: KtConstructor<TBuilder> | null;
  public implements: (KtReference<TBuilder> | AppendValue<TBuilder>)[];
  public values: KtEnumValue<TBuilder>[];
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

  constructor(options: KtEnumOptions<TBuilder>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.annotations = options.annotations ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.primaryConstructor = options.primaryConstructor ?? null;
    this.implements = options.implements ?? [];
    this.values = options.values ?? [];
    this.members = options.members ?? [];
    this.companionObject = options.companionObject ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .append((b) => ktDoc.get(this.doc, { parameters: this.primaryConstructor?.parameters })?.write(b))
      .append((b) => ktAnnotation.write(b, this.annotations, { multiline: true }))
      .appendIf(!!this.accessModifier, this.accessModifier, ' ')
      .append('enum class ', this.name)
      .append((b) => this.primaryConstructor?.writeAsPrimary(b))
      .appendIf(this.implements.length > 0, ' : ')
      .forEach(this.implements, writeKt, { separator: ', ' })
      .if(
        this.values.length > 0 ||
          this.members.some(notNullish) ||
          !!this.primaryConstructor?.body ||
          !!this.companionObject,
        (b) =>
          b.append(' ').parenthesize(
            '{}',
            (b) =>
              b
                .append((b) => ktEnumValue.write(b, this.values))
                .appendIf(this.members.some(notNullish) || !!this.companionObject, ';', (b) =>
                  b.ensurePreviousLineEmpty()
                )
                .append((b) =>
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
                  ])
                ),
            { multiline: true }
          )
      )
      .appendLine();
  }
}

const createEnum = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  name: KtEnum<TBuilder>['name'],
  values?: Nullable<KtEnum<TBuilder>['values']>,
  options?: Prettify<Omit<KtEnumOptions<TBuilder>, 'name' | 'values'>>
) => new KtEnum<TBuilder>({ ...options, name, values: values ?? undefined });

const writeEnums = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<KtEnum<TBuilder> | AppendValue<TBuilder>>
) => {
  builder.forEach(toArray(nodes), writeKt, { separator: '\n' });
};

export const ktEnum = Object.assign(createEnum, {
  write: writeEnums,
});
