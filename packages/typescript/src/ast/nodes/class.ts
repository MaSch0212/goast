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
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsConstructor } from './constructor.ts';
import { type TsDecorator, tsDecorator } from './decorator.ts';
import { type TsDoc, tsDoc } from './doc.ts';
import { type TsGenericParameter, tsGenericParameter } from './generic-parameter.ts';
import type { TsIndexer } from './indexer.ts';
import type { TsMethod } from './method.ts';
import type { TsProperty } from './property.ts';
import type { TsReference } from './reference.ts';

type Injects = 'doc' | 'decorators' | 'modifiers' | 'name' | 'generics' | 'extends' | 'implements' | 'body' | 'members';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<TsDoc<TBuilder>>;
    decorators?: Nullable<Nullable<TsDecorator<TBuilder>>[]>;
    export?: Nullable<boolean>;
    abstract?: Nullable<boolean>;
    name: string;
    generics?: Nullable<Nullable<TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    extends?: Nullable<TsReference<TBuilder> | BasicAppendValue<TBuilder>>;
    implements?: Nullable<Nullable<TsReference<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    members?: Nullable<Nullable<Member<TBuilder>>[]>;
  }
>;

type Member<TBuilder extends SourceBuilder> =
  | TsProperty<TBuilder>
  | TsMethod<TBuilder>
  | TsIndexer<TBuilder>
  | TsConstructor<TBuilder>
  | BasicAppendValue<TBuilder>;

/**
 * Represents a TypeScript class declaration.
 *
 * Written in this order: doc comment, decorators, modifiers, name, generics, heritage clauses, then the body.
 *
 * @template TBuilder The type of the source builder the class is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsClass
 */
export class TsClass<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The doc comment written above the class, or `null` to omit it.
   * Descriptions of generic parameters are merged into it as `@template` tags.
   */
  public doc: TsDoc<TBuilder> | null;
  /**
   * The decorators written above the class declaration, each on its own line.
   */
  public decorators: TsDecorator<TBuilder>[];
  /**
   * Whether the class is written with the `export` keyword.
   * @default false
   */
  public export: boolean;
  /**
   * Whether the class is written with the `abstract` modifier, placed after `export` when both are set.
   * @default false
   */
  public abstract: boolean;
  /**
   * The class name, written verbatim after the `class` keyword.
   */
  public name: string;
  /**
   * The type parameters written in angle brackets after the name, such as `<T, U>`.
   * Plain strings are written as-is; described parameters also add a `@template` tag to the doc comment.
   */
  public generics: (TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The base class written after `extends`, or `null` to omit the clause.
   */
  public extends: TsReference<TBuilder> | BasicAppendValue<TBuilder> | null;
  /**
   * The interfaces written after `implements` as a comma-separated list. The clause is omitted when empty.
   */
  public implements: (TsReference<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The members written in the class body, in the given order.
   * Properties and bodyless methods without a doc comment or decorators are written without blank lines,
   * other members are set off by blank lines.
   */
  public members: Member<TBuilder>[];

  /**
   * Initializes a new instance of the TsClass class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.decorators = options.decorators?.filter(notNullish) ?? [];
    this.export = options.export ?? false;
    this.abstract = options.abstract ?? false;
    this.name = options.name;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.extends = options.extends ?? null;
    this.implements = options.implements?.filter(notNullish) ?? [];
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
    if (this.abstract) builder.append('abstract ');
    builder.append(this.inject.afterModifiers);

    builder.append('class ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    builder.append(this.inject.beforeGenerics);
    tsGenericParameter.write(builder, this.generics);
    builder.append(this.inject.afterGenerics);

    if (this.extends) {
      builder.append(' extends ');
      builder.append(this.inject.beforeExtends);
      writeTsNode(builder, this.extends);
      builder.append(this.inject.afterExtends);
    }

    if (this.implements.length > 0) {
      builder.append(' implements ');
      builder.append(this.inject.beforeImplements);
      writeTsNodes(builder, this.implements, { separator: ', ' });
      builder.append(this.inject.afterImplements);
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

const createClass = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): TsClass<TBuilder> => new TsClass<TBuilder>({ ...options, name });

/**
 * Factory for creating class nodes. The `write` function writes one or more class nodes to a builder.
 *
 * @param name The name of the class.
 * @param options The settings of the class. See `TsClass` for the available properties.
 * @example
 * ```ts
 * tsClass('X', {
 *   decorators: [tsDecorator('decorator')],
 *   export: true,
 *   abstract: true,
 *   generics: ['T', 'U'],
 *   extends: tsReference('Y'),
 *   implements: [tsReference('Z')],
 *   members: [tsProperty('x'), tsConstructor(), tsMethod('y')],
 * });
 * // Emits:
 * // @decorator
 * // export abstract class X<T, U> extends Y implements Z {
 * //   x;
 * //
 * //   constructor() {}
 * //
 * //   y();
 * // }
 * ```
 */
export const tsClass: typeof createClass & { write: typeof writeTsNodes } = Object.assign(createClass, {
  write: writeTsNodes,
});
