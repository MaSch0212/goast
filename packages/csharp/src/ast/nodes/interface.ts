import {
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import type { CsAccessModifier } from '../common.ts';
import { CsNode } from '../node.ts';
import { writeCsAttributes } from '../utils/write-cs-attributes.ts';
import { type CsAppendValue, writeCsNodes } from '../utils/write-cs-node.ts';
import { writeCsMembers } from '../utils/write-cs-members.ts';
import type { CsAttribute } from './attribute.ts';
import { type CsDoc, csDoc } from './doc.ts';
import { type CsGenericParameter, csGenericParameter } from './generic-parameter.ts';
import type { CsMethod } from './method.ts';
import type { CsProperty } from './property.ts';
import type { CsType } from './types.ts';

type Injects =
  | 'doc'
  | 'attributes'
  | 'modifiers'
  | 'name'
  | 'generics'
  | 'baseList'
  | 'constraints'
  | 'body'
  | 'members';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<CsDoc<TBuilder>>;
    attributes?: Nullable<Nullable<CsAttribute<TBuilder>>[]>;
    accessModifier?: Nullable<CsAccessModifier>;
    partial?: Nullable<boolean>;
    name: string;
    generics?: Nullable<Nullable<CsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    /** The interfaces this interface extends. */
    extends?: Nullable<Nullable<CsType<TBuilder>>[]>;
    members?: Nullable<Nullable<CsInterfaceMember<TBuilder>>[]>;
  }
>;

export type CsInterfaceMember<TBuilder extends SourceBuilder> =
  | CsProperty<TBuilder>
  | CsMethod<TBuilder>
  | CsAppendValue<TBuilder>;

export class CsInterface<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public doc: CsDoc<TBuilder> | null;
  public attributes: CsAttribute<TBuilder>[];
  public accessModifier: CsAccessModifier | null;
  public partial: boolean;
  public name: string;
  public generics: (CsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public extends: CsType<TBuilder>[];
  public members: CsInterfaceMember<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.attributes = options.attributes?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.partial = options.partial ?? false;
    this.name = options.name;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.extends = options.extends?.filter(notNullish) ?? [];
    this.members = options.members?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    csDoc.get(this.doc, { generics: this.generics })?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAttributes);
    writeCsAttributes(builder, this.attributes, { multiline: true });
    builder.append(this.inject.afterAttributes);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.partial) builder.append('partial ');
    builder.append(this.inject.afterModifiers);

    builder.append('interface ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    builder.append(this.inject.beforeGenerics);
    csGenericParameter.write(builder, this.generics);
    builder.append(this.inject.afterGenerics);

    if (this.extends.length > 0) {
      builder.append(' : ');
      builder.append(this.inject.beforeBaseList);
      writeCsNodes(builder, this.extends, { separator: ', ' });
      builder.append(this.inject.afterBaseList);
    }

    builder.append(this.inject.beforeConstraints);
    csGenericParameter.writeConstraints(builder, this.generics);
    builder.append(this.inject.afterConstraints);

    builder.ensureCurrentLineEmpty();
    builder.append(this.inject.beforeBody);
    builder.parenthesize(
      '{}',
      (b) => {
        b.append(this.inject.beforeMembers);
        writeCsMembers(b, this.members);
        b.append(this.inject.afterMembers);
      },
      { multiline: true },
    );
    builder.append(this.inject.afterBody);

    builder.appendLine();
  }
}

const createInterface = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): CsInterface<TBuilder> => new CsInterface<TBuilder>({ ...options, name });

export const csInterface: typeof createInterface & { write: typeof writeCsNodes } = Object.assign(createInterface, {
  write: writeCsNodes,
});
