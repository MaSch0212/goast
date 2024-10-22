import {
  type AppendValue,
  type AstNodeOptions,
  type BasicAppendValue,
  createOverwriteProxy,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import type { KtAccessModifier } from '../common.ts';
import { KtNode } from '../node.ts';
import { writeKtMembers } from '../utils/write-kt-members.ts';
import { writeKtNodes } from '../utils/write-kt-node.ts';
import { type KtAnnotation, ktAnnotation } from './annotation.ts';
import type { KtClass } from './class.ts';
import { type KtDoc, ktDoc } from './doc.ts';
import type { KtEnum } from './enum.ts';
import type { KtFunction } from './function.ts';
import { type KtGenericParameter, ktGenericParameter } from './generic-parameter.ts';
import type { KtObject } from './object.ts';
import type { KtProperty } from './property.ts';
import type { KtType } from './types.ts';

type Injects = 'doc' | 'annotations' | 'modifiers' | 'name' | 'generics' | 'extends' | 'body' | 'members';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<KtDoc<TBuilder>>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    accessModifier?: Nullable<KtAccessModifier>;
    name: string;
    generics?: Nullable<Nullable<KtGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    extends?: Nullable<Nullable<KtType<TBuilder>>[]>;
    members?: Nullable<Nullable<KtInterfaceMember<TBuilder>>[]>;
    companionObject?: Nullable<KtObject<TBuilder>>;
  }
>;

export type KtInterfaceMember<TBuilder extends SourceBuilder> =
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
  public generics: (KtGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public extends: KtType<TBuilder>[];
  public members: KtInterfaceMember<TBuilder>[];
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
    builder.append(this.inject.beforeDoc);
    ktDoc.get(this.doc, { generics: this.generics })?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations, { multiline: true });
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    builder.append(this.inject.afterModifiers);

    builder.append('interface ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    builder.append(this.inject.beforeGenerics);
    ktGenericParameter.write(builder, this.generics);
    builder.append(this.inject.afterGenerics);

    if (this.extends.length > 0) {
      builder.append(' : ');
      builder.append(this.inject.beforeExtends);
      writeKtNodes(builder, this.extends, { separator: ', ' });
      builder.append(this.inject.afterExtends);
    }

    const allMembers = [
      this.companionObject ? createOverwriteProxy(this.companionObject, { companion: true }) : null,
      ...this.members,
    ].filter(notNullish);

    if (allMembers.length > 0) {
      builder.append(' ');
      builder.append(this.inject.beforeBody);
      builder.parenthesize(
        '{}',
        (b) => {
          b.append(this.inject.beforeMembers);
          writeKtMembers(b, allMembers);
          b.append(this.inject.afterMembers);
        },
        { multiline: true },
      );
      builder.append(this.inject.afterBody);
    }

    builder.appendLine();
  }
}

const createInterface = <TBuilder extends SourceBuilder>(
  name: KtInterface<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
) => new KtInterface<TBuilder>({ ...options, name });

export const ktInterface = Object.assign(createInterface, {
  write: writeKtNodes,
});
