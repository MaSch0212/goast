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

/**
 * Represents an interface declaration.
 *
 * Written in this order: the doc comment, the decorators, the `export` keyword, the name, the generics, the `extends`
 * list, then the members in braces, followed by a line break.
 *
 * @template TBuilder The type of the source builder the interface is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsInterface
 */
export class TsInterface<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The doc comment written above the interface, or `null` to omit it. Descriptions of generic parameters are merged
   * into it as `@template` tags.
   */
  public doc: TsDoc<TBuilder> | null;
  /**
   * The decorators written above the interface, each on its own line.
   */
  public decorators: TsDecorator<TBuilder>[];
  /**
   * Whether the interface is written with the `export` keyword.
   * @default false
   */
  public export: boolean;
  /**
   * The name of the interface, written after the `interface` keyword.
   */
  public name: string;
  /**
   * The type parameters written in angle brackets after the name, such as `<T, U>`. Nothing is written when empty.
   */
  public generics: (TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The interfaces written after `extends` as a comma-separated list. The clause is omitted when empty.
   */
  public extends: (TsReference<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The members written in the body, in the given order. Properties and bodyless methods without a doc comment or
   * decorators are written without blank lines, other members are set off by blank lines.
   */
  public members: Member<TBuilder>[];

  /**
   * Initializes a new instance of the TsInterface class.
   * @param options The options to use for this instance.
   */
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

/**
 * Factory for creating interface nodes. The `write` function writes one or more interfaces to a builder.
 *
 * @param name The name of the interface.
 * @param options The settings of the interface. See `TsInterface` for the available properties.
 * @example
 * ```ts
 * tsInterface('User', {
 *   export: true,
 *   extends: [tsReference('Entity')],
 *   members: [tsProperty('name', { type: 'string' }), tsMethod('save')],
 * });
 * // Emits:
 * // export interface User extends Entity {
 * //   name: string;
 * //   save();
 * // }
 * ```
 */
export const tsInterface: typeof createInterface & { write: typeof writeTsNodes } = Object.assign(createInterface, {
  write: writeTsNodes,
});
