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
import { writeCsMembers } from '../utils/write-cs-members.ts';
import { writeCsNode, writeCsNodes } from '../utils/write-cs-node.ts';
import { type CsArgument, csArgument } from './argument.ts';
import type { CsAttribute } from './attribute.ts';
import type { CsClassMember } from './class.ts';
import { type CsDoc, csDoc } from './doc.ts';
import { type CsGenericParameter, csGenericParameter } from './generic-parameter.ts';
import { type CsParameter, csParameter } from './parameter.ts';
import type { CsType, CsValue } from './types.ts';

type Injects =
  | 'doc'
  | 'attributes'
  | 'modifiers'
  | 'name'
  | 'generics'
  | 'parameters'
  | 'baseList'
  | 'constraints'
  | 'body'
  | 'members';

export type CsRecordKind = 'class' | 'struct';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<CsDoc<TBuilder>>;
    attributes?: Nullable<Nullable<CsAttribute<TBuilder>>[]>;
    accessModifier?: Nullable<CsAccessModifier>;
    /** `class` (default) writes `record`, `struct` writes `record struct`. */
    kind?: Nullable<CsRecordKind>;
    abstract?: Nullable<boolean>;
    sealed?: Nullable<boolean>;
    partial?: Nullable<boolean>;
    /** Writes `readonly record struct`. Only valid for `kind: 'struct'`. */
    readonly?: Nullable<boolean>;
    name: string;
    generics?: Nullable<Nullable<CsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    /** The positional parameters of the record. An empty array writes `()`. */
    parameters?: Nullable<Nullable<CsParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    /** The base record. */
    extends?: Nullable<CsType<TBuilder>>;
    /** The arguments passed to the base record's constructor (`: Base(X)`). */
    baseArguments?: Nullable<Nullable<CsArgument<TBuilder> | CsValue<TBuilder>>[]>;
    implements?: Nullable<Nullable<CsType<TBuilder>>[]>;
    /** The members. A record without members is written as `record Name(...);`. */
    members?: Nullable<Nullable<CsClassMember<TBuilder>>[]>;
  }
>;

export class CsRecord<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public doc: CsDoc<TBuilder> | null;
  public attributes: CsAttribute<TBuilder>[];
  public accessModifier: CsAccessModifier | null;
  public kind: CsRecordKind;
  public abstract: boolean;
  public sealed: boolean;
  public partial: boolean;
  public readonly: boolean;
  public name: string;
  public generics: (CsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public parameters: (CsParameter<TBuilder> | BasicAppendValue<TBuilder>)[] | null;
  public extends: CsType<TBuilder> | null;
  public baseArguments: (CsArgument<TBuilder> | CsValue<TBuilder>)[];
  public implements: CsType<TBuilder>[];
  public members: CsClassMember<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.attributes = options.attributes?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.kind = options.kind ?? 'class';
    this.abstract = options.abstract ?? false;
    this.sealed = options.sealed ?? false;
    this.partial = options.partial ?? false;
    this.readonly = options.readonly ?? false;
    this.name = options.name;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.parameters = options.parameters?.filter(notNullish) ?? null;
    this.extends = options.extends ?? null;
    this.baseArguments = options.baseArguments?.filter(notNullish) ?? [];
    this.implements = options.implements?.filter(notNullish) ?? [];
    this.members = options.members?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    csDoc.get(this.doc, { generics: this.generics, parameters: this.parameters })?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAttributes);
    writeCsAttributes(builder, this.attributes, { multiline: true });
    builder.append(this.inject.afterAttributes);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.abstract) builder.append('abstract ');
    if (this.sealed) builder.append('sealed ');
    if (this.readonly) builder.append('readonly ');
    if (this.partial) builder.append('partial ');
    builder.append(this.inject.afterModifiers);

    builder.append(this.kind === 'struct' ? 'record struct ' : 'record ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    builder.append(this.inject.beforeGenerics);
    csGenericParameter.write(builder, this.generics);
    builder.append(this.inject.afterGenerics);

    if (this.parameters) {
      builder.append(this.inject.beforeParameters);
      csParameter.write(builder, this.parameters);
      builder.append(this.inject.afterParameters);
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

    if (this.members.length === 0) {
      builder.appendLine(';');
      return;
    }

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

const createRecord = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): CsRecord<TBuilder> => new CsRecord<TBuilder>({ ...options, name });

export const csRecord: typeof createRecord & { write: typeof writeCsNodes } = Object.assign(createRecord, {
  write: writeCsNodes,
});
