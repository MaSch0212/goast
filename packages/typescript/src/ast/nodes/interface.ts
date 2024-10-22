import {
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsMembers } from '../utils/write-ts-members.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';
import { type TsDecorator, tsDecorator } from './decorator.ts';
import { type TsDoc, tsDoc } from './doc.ts';
import { type TsGenericParameter, tsGenericParameter } from './generic-parameter.ts';
import type { TsIndexer } from './indexer.ts';
import type { TsMethod } from './method.ts';
import type { TsProperty } from './property.ts';
import type { TsReference } from './reference.ts';

type Injects = 'doc' | 'decorators' | 'modifiers' | 'name' | 'generics' | 'extends' | 'body' | 'members';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<TsDoc<TBuilder>>;
    decorators?: Nullable<Nullable<TsDecorator<TBuilder>>[]>;
    export?: Nullable<boolean>;
    name: string;
    generics?: Nullable<Nullable<TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    extends?: Nullable<Nullable<TsReference<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    members?: Nullable<Nullable<Member<TBuilder>>[]>;
  }
>;

type Member<TBuilder extends SourceBuilder> =
  | TsIndexer<TBuilder>
  | TsProperty<TBuilder>
  | TsMethod<TBuilder>
  | BasicAppendValue<TBuilder>;

export class TsInterface<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public doc: TsDoc<TBuilder> | null;
  public decorators: TsDecorator<TBuilder>[];
  public export: boolean;
  public name: string;
  public generics: (TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public extends: (TsReference<TBuilder> | BasicAppendValue<TBuilder>)[];
  public members: Member<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.decorators = options.decorators?.filter(notNullish) ?? [];
    this.export = options.export ?? false;
    this.name = options.name;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.extends = options.extends?.filter(notNullish) ?? [];
    this.members = options.members?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    tsDoc.write(builder, tsDoc.get(this.doc, { generics: this.generics }));
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeDecorators);
    tsDecorator.write(builder, this.decorators, { multiline: true });
    builder.append(this.inject.afterDecorators);

    builder.append(this.inject.beforeModifiers);
    if (this.export) builder.append('export ');
    builder.append(this.inject.afterModifiers);

    builder.append('interface ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    builder.append(this.inject.beforeGenerics);
    tsGenericParameter.write(builder, this.generics);
    builder.append(this.inject.afterGenerics);

    if (this.extends.length > 0) {
      builder.append(' extends ');
      builder.append(this.inject.beforeExtends);
      writeTsNodes(builder, this.extends, { separator: ', ' });
      builder.append(this.inject.afterExtends);
    }

    builder.append(' ');

    builder.append(this.inject.beforeBody);
    builder.parenthesize(
      '{}',
      (b) => {
        b.append(this.inject.beforeMembers);
        writeTsMembers(b, this.members);
        b.append(this.inject.afterMembers);
      },
      { multiline: this.members.length > 0 },
    );
    builder.append(this.inject.afterBody);

    builder.appendLine();
  }
}

const createInterface = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): TsInterface<TBuilder> => new TsInterface<TBuilder>({ ...options, name });

export const tsInterface: typeof createInterface & { write: typeof writeTsNodes } = Object.assign(createInterface, {
  write: writeTsNodes,
});
