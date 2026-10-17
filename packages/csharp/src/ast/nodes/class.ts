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
import { type CsAppendValue, writeCsNode, writeCsNodes } from '../utils/write-cs-node.ts';
import { writeCsMembers } from '../utils/write-cs-members.ts';
import { type CsArgument, csArgument } from './argument.ts';
import type { CsAttribute } from './attribute.ts';
import type { CsConstructor } from './constructor.ts';
import { type CsDoc, csDoc } from './doc.ts';
import type { CsEnum } from './enum.ts';
import type { CsField } from './field.ts';
import { type CsGenericParameter, csGenericParameter } from './generic-parameter.ts';
import type { CsInterface } from './interface.ts';
import type { CsMethod } from './method.ts';
import { type CsParameter, csParameter } from './parameter.ts';
import type { CsProperty } from './property.ts';
import type { CsRecord } from './record.ts';
import type { CsType, CsValue } from './types.ts';

type Injects =
  | 'doc'
  | 'attributes'
  | 'modifiers'
  | 'name'
  | 'generics'
  | 'primaryConstructor'
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
    abstract?: Nullable<boolean>;
    sealed?: Nullable<boolean>;
    static?: Nullable<boolean>;
    partial?: Nullable<boolean>;
    name: string;
    generics?: Nullable<Nullable<CsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    /** The parameters of a C# 12 primary constructor. An empty array writes `()`. */
    primaryConstructor?: Nullable<Nullable<CsParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    /** The base class. */
    extends?: Nullable<CsType<TBuilder>>;
    /** The arguments passed to the base class' constructor from the primary constructor (`: Base(x)`). */
    baseArguments?: Nullable<Nullable<CsArgument<TBuilder> | CsValue<TBuilder>>[]>;
    implements?: Nullable<Nullable<CsType<TBuilder>>[]>;
    members?: Nullable<Nullable<CsClassMember<TBuilder>>[]>;
  }
>;

export type CsClassMember<TBuilder extends SourceBuilder> =
  | CsConstructor<TBuilder>
  | CsField<TBuilder>
  | CsProperty<TBuilder>
  | CsMethod<TBuilder>
  | CsClass<TBuilder>
  | CsRecord<TBuilder>
  | CsInterface<TBuilder>
  | CsEnum<TBuilder>
  | CsAppendValue<TBuilder>;

export class CsClass<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public doc: CsDoc<TBuilder> | null;
  public attributes: CsAttribute<TBuilder>[];
  public accessModifier: CsAccessModifier | null;
  public abstract: boolean;
  public sealed: boolean;
  public static: boolean;
  public partial: boolean;
  public name: string;
  public generics: (CsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public primaryConstructor: (CsParameter<TBuilder> | BasicAppendValue<TBuilder>)[] | null;
  public extends: CsType<TBuilder> | null;
  public baseArguments: (CsArgument<TBuilder> | CsValue<TBuilder>)[];
  public implements: CsType<TBuilder>[];
  public members: CsClassMember<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.attributes = options.attributes?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.abstract = options.abstract ?? false;
    this.sealed = options.sealed ?? false;
    this.static = options.static ?? false;
    this.partial = options.partial ?? false;
    this.name = options.name;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.primaryConstructor = options.primaryConstructor?.filter(notNullish) ?? null;
    this.extends = options.extends ?? null;
    this.baseArguments = options.baseArguments?.filter(notNullish) ?? [];
    this.implements = options.implements?.filter(notNullish) ?? [];
    this.members = options.members?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    csDoc.get(this.doc, { generics: this.generics, parameters: this.primaryConstructor })?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAttributes);
    writeCsAttributes(builder, this.attributes, { multiline: true });
    builder.append(this.inject.afterAttributes);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.static) builder.append('static ');
    if (this.abstract) builder.append('abstract ');
    if (this.sealed) builder.append('sealed ');
    if (this.partial) builder.append('partial ');
    builder.append(this.inject.afterModifiers);

    builder.append('class ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    builder.append(this.inject.beforeGenerics);
    csGenericParameter.write(builder, this.generics);
    builder.append(this.inject.afterGenerics);

    if (this.primaryConstructor) {
      builder.append(this.inject.beforePrimaryConstructor);
      csParameter.write(builder, this.primaryConstructor);
      builder.append(this.inject.afterPrimaryConstructor);
    }

    if (this.extends || this.implements.length > 0) {
      builder.append(' : ');
      builder.append(this.inject.beforeBaseList);
      writeCsNode(builder, this.extends);
      if (this.extends && this.baseArguments.length > 0) {
        csArgument.write(builder, this.baseArguments);
      }
      if (this.extends && this.implements.length > 0) {
        builder.append(', ');
      }
      writeCsNodes(builder, this.implements, { separator: ', ' });
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

const createClass = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): CsClass<TBuilder> => new CsClass<TBuilder>({ ...options, name });

export const csClass: typeof createClass & { write: typeof writeCsNodes } = Object.assign(createClass, {
  write: writeCsNodes,
});
