import {
  SourceBuilder,
  AppendValue,
  AstNodeOptions,
  notNullish,
  Prettify,
  SingleOrMultiple,
  toArray,
  Nullable,
} from '@goast/core';

import { ktAnnotation, KtAnnotation } from './annotation';
import { KtClass } from './class';
import { ktDoc, KtDoc } from './doc';
import { KtEnum } from './enum';
import { KtFunction } from './function';
import { ktGenericParameter, KtGenericParameter } from './generic-parameter';
import { KtObject } from './object';
import { KtProperty } from './property';
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
    name: string;
    generics?: Nullable<Nullable<KtGenericParameter<TBuilder>>[]>;
    extends?: Nullable<Nullable<AppendValue<TBuilder>>[]>;
    members?: Nullable<Nullable<Member<TBuilder>>[]>;
    companionObject?: Nullable<KtObject<TBuilder>>;
  }
>;

type Member<TBuilder extends SourceBuilder> =
  | KtEnum<TBuilder>
  | KtInterface<TBuilder>
  | KtProperty<TBuilder>
  | KtFunction<TBuilder>
  | KtClass<TBuilder>
  | AppendValue<TBuilder>;

export class KtInterface<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public doc: KtDoc<TBuilder> | null;
  public annotations: KtAnnotation<TBuilder>[];
  public accessModifier: KtAccessModifier | null;
  public name: string;
  public generics: KtGenericParameter<TBuilder>[];
  public extends: AppendValue<TBuilder>[];
  public members: Member<TBuilder>[];
  public companionObject: KtObject<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.name = options.name;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.extends = options.extends?.filter(notNullish) ?? [];
    this.members = options.members?.filter(notNullish) ?? [];
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
          { multiline: true },
        ),
      )
      .appendLine();
  }
}

const createInterface = <TBuilder extends SourceBuilder>(
  name: KtInterface<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
) => new KtInterface<TBuilder>({ ...options, name });

const writeInterfaces = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtInterface<TBuilder> | AppendValue<TBuilder>>>,
) => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, writeKt, { separator: '\n' });
};

export const ktInterface = Object.assign(createInterface, {
  write: writeInterfaces,
});
