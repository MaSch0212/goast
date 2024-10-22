import {
  type AppendValue,
  type AstNodeOptions,
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
import type { KtConstructor } from './constructor.ts';
import { type KtDoc, ktDoc } from './doc.ts';
import { type KtEnumValue, ktEnumValue } from './enum-value.ts';
import type { KtFunction } from './function.ts';
import { type KtInitBlock, ktInitBlock } from './init-block.ts';
import type { KtInterface } from './interface.ts';
import type { KtObject } from './object.ts';
import type { KtProperty } from './property.ts';
import type { KtType } from './types.ts';

type Injects =
  | 'doc'
  | 'annotations'
  | 'modifiers'
  | 'name'
  | 'primaryConstructor'
  | 'implements'
  | 'body'
  | 'values'
  | 'members';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    doc?: Nullable<KtDoc<TBuilder>>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    accessModifier?: Nullable<KtAccessModifier>;
    primaryConstructor?: Nullable<KtConstructor<TBuilder>>;
    implements?: Nullable<Nullable<KtType<TBuilder>>[]>;
    values?: Nullable<KtEnumValue<TBuilder>[]>;
    members?: Nullable<Nullable<KtEnumMember<TBuilder>>[]>;
    companionObject?: Nullable<KtObject<TBuilder>>;
  }
>;

export type KtEnumMember<TBuilder extends SourceBuilder> =
  | KtConstructor<TBuilder>
  | KtEnum<TBuilder>
  | KtInitBlock<TBuilder>
  | KtInterface<TBuilder>
  | KtProperty<TBuilder>
  | KtFunction<TBuilder>
  | KtClass<TBuilder>
  | AppendValue<TBuilder>;

export class KtEnum<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public doc: KtDoc<TBuilder> | null;
  public annotations: KtAnnotation<TBuilder>[];
  public accessModifier: KtAccessModifier | null;
  public primaryConstructor: KtConstructor<TBuilder> | null;
  public implements: KtType<TBuilder>[];
  public values: KtEnumValue<TBuilder>[];
  public members: KtEnumMember<TBuilder>[];
  public companionObject: KtObject<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.primaryConstructor = options.primaryConstructor ?? null;
    this.implements = options.implements?.filter(notNullish) ?? [];
    this.values = options.values ?? [];
    this.members = options.members?.filter(notNullish) ?? [];
    this.companionObject = options.companionObject ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    ktDoc.get(this.doc, { parameters: this.primaryConstructor?.parameters })?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations, { multiline: true });
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    builder.append(this.inject.afterModifiers);

    builder.append('enum class ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    if (this.primaryConstructor) {
      builder.append(this.inject.beforePrimaryConstructor);
      this.primaryConstructor.writeAsPrimary(builder);
      builder.append(this.inject.afterPrimaryConstructor);
    }

    if (this.implements.length > 0) {
      builder.append(' : ');
      builder.append(this.inject.beforeImplements);
      writeKtNodes(builder, this.implements, { separator: ', ' });
      builder.append(this.inject.afterImplements);
    }

    const allMembers = [
      this.companionObject ? createOverwriteProxy(this.companionObject, { companion: true }) : null,
      this.primaryConstructor?.body ? ktInitBlock(this.primaryConstructor?.body) : null,
      ...this.members,
    ].filter(notNullish);

    if (this.values.length > 0 || allMembers.length > 0) {
      builder.append(' ');
      builder.append(this.inject.beforeBody);
      builder.parenthesize(
        '{}',
        (b) => {
          if (this.values.length > 0) {
            b.append(this.inject.beforeValues);
            ktEnumValue.write(b, this.values);
            if (allMembers.length > 0) {
              b.append(';\n\n');
            }
            b.append(this.inject.afterValues);
          }

          if (allMembers.length > 0) {
            b.append(this.inject.beforeMembers);
            writeKtMembers(b, allMembers);
            b.append(this.inject.afterMembers);
          }
        },
        { multiline: true },
      );
      builder.append(this.inject.afterBody);
    }

    builder.appendLine();
  }
}

const createEnum = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  values?: Options<TBuilder>['values'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'values'>>,
): KtEnum<TBuilder> => new KtEnum<TBuilder>({ ...options, name, values: values ?? undefined });

export const ktEnum: typeof createEnum & { write: typeof writeKtNodes } = Object.assign(createEnum, {
  write: writeKtNodes,
});
