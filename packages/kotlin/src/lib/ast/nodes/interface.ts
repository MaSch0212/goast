import {
  SourceBuilder,
  AppendValue,
  AstNodeOptions,
  notNullish,
  Prettify,
  SingleOrMultiple,
  toArray,
} from '@goast/core';

import { ktAnnotation, KtAnnotation } from './annotation';
import { KtClass } from './class';
import { ktDoc, KtDoc } from './doc';
import { KtEnum } from './enum';
import { KtFunction } from './function';
import { ktGenericParameter, KtGenericParameter } from './generic-parameter';
import { KtObject } from './object';
import { KtProperty } from './property';
import { KotlinFileBuilder } from '../../file-builder';
import { KtAccessModifier } from '../common';
import { KtNode } from '../node';
import { writeKt, writeKtMembers } from '../utils';

type KtInterfaceOptions<TBuilder extends SourceBuilder> = AstNodeOptions<
  KtInterface<TBuilder>,
  typeof KtNode<TBuilder>,
  'name'
>;

export class KtInterface<
  TBuilder extends SourceBuilder = KotlinFileBuilder,
  TInjects extends string = never
> extends KtNode<TBuilder, TInjects> {
  public doc: KtDoc<TBuilder> | null;
  public annotations: KtAnnotation<TBuilder>[];
  public accessModifier: KtAccessModifier;
  public name: string;
  public generics: KtGenericParameter<TBuilder>[];
  public extends: AppendValue<TBuilder>[];
  public members: (
    | KtEnum<TBuilder>
    | KtInterface<TBuilder>
    | KtProperty<TBuilder>
    | KtFunction<TBuilder>
    | KtClass<TBuilder>
    | AppendValue<TBuilder>
  )[];
  public companionObject: KtObject<TBuilder> | null;

  constructor(options: KtInterfaceOptions<TBuilder>) {
    super(options);
    this.doc = options.doc ?? null;
    this.annotations = options.annotations ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.name = options.name;
    this.generics = options.generics ?? [];
    this.extends = options.extends ?? [];
    this.members = options.members ?? [];
    this.companionObject = options.companionObject ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .append((b) => ktDoc.get(this.doc, { generics: this.generics })?.write(b))
      .append((b) => ktAnnotation.write(b, this.annotations, { multiline: true }))
      .appendIf(!!this.accessModifier, this.accessModifier, ' ')
      .append('interface ', this.name, (b) => ktGenericParameter.write(b, this.generics))
      .appendIf(this.extends.length > 0, ' : ')
      .forEach(this.extends, (b, i) => b.append(i), { separator: ', ' })
      .if(this.members.some(notNullish) || !!this.companionObject, (b) =>
        b.append(' ').parenthesize(
          '{}',
          (b) =>
            writeKtMembers(b, [
              ...this.members,
              this.companionObject
                ? (b) =>
                    b
                      .if(this.members.some(notNullish), (b) => b.ensurePreviousLineEmpty())
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

const createInterface = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  name: KtInterface<TBuilder>['name'],
  options?: Prettify<Omit<KtInterfaceOptions<TBuilder>, 'name'>>
) => new KtInterface<TBuilder>({ ...options, name });

const writeInterfaces = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<KtInterface<TBuilder> | AppendValue<TBuilder>>
) => {
  builder.forEach(toArray(nodes), writeKt, { separator: '\n' });
};

export const ktInterface = Object.assign(createInterface, {
  write: writeInterfaces,
});
