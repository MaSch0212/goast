import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import type { CsAccessModifier } from '../common.ts';
import { CsNode } from '../node.ts';
import { writeCsAttributes } from '../utils/write-cs-attributes.ts';
import { writeCsNode, writeCsNodes } from '../utils/write-cs-node.ts';
import type { CsAttribute } from './attribute.ts';
import type { CsDoc } from './doc.ts';
import { type CsEnumMember, csEnumMember } from './enum-member.ts';
import type { CsType } from './types.ts';

type Injects = 'doc' | 'attributes' | 'modifiers' | 'name' | 'underlyingType' | 'body' | 'members';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<CsDoc<TBuilder>>;
    attributes?: Nullable<Nullable<CsAttribute<TBuilder>>[]>;
    accessModifier?: Nullable<CsAccessModifier>;
    name: string;
    /** The underlying integral type (`enum Name : byte`). */
    underlyingType?: Nullable<CsType<TBuilder>>;
    members?: Nullable<Nullable<CsEnumMember<TBuilder>>[]>;
  }
>;

export class CsEnum<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public doc: CsDoc<TBuilder> | null;
  public attributes: CsAttribute<TBuilder>[];
  public accessModifier: CsAccessModifier | null;
  public name: string;
  public underlyingType: CsType<TBuilder> | null;
  public members: CsEnumMember<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.attributes = options.attributes?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.name = options.name;
    this.underlyingType = options.underlyingType ?? null;
    this.members = options.members?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    this.doc?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAttributes);
    writeCsAttributes(builder, this.attributes, { multiline: true });
    builder.append(this.inject.afterAttributes);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    builder.append(this.inject.afterModifiers);

    builder.append('enum ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    if (this.underlyingType) {
      builder.append(' : ', this.inject.beforeUnderlyingType);
      writeCsNode(builder, this.underlyingType);
      builder.append(this.inject.afterUnderlyingType);
    }

    builder.ensureCurrentLineEmpty();
    builder.append(this.inject.beforeBody);
    builder.parenthesize(
      '{}',
      (b) => {
        b.append(this.inject.beforeMembers);
        csEnumMember.write(b, this.members);
        b.append(this.inject.afterMembers);
      },
      { multiline: true },
    );
    builder.append(this.inject.afterBody);

    builder.appendLine();
  }
}

const createEnum = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): CsEnum<TBuilder> => new CsEnum<TBuilder>({ ...options, name });

export const csEnum: typeof createEnum & { write: typeof writeCsNodes } = Object.assign(createEnum, {
  write: writeCsNodes,
});
