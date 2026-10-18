import {
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsDoc } from './doc.ts';
import { type TsGenericParameter, tsGenericParameter } from './generic-parameter.ts';
import type { TsType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    doc?: Nullable<TsDoc<TBuilder>>;
    generics?: Nullable<Nullable<TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    type: TsType<TBuilder>;
    export?: Nullable<boolean>;
  }
>;

/**
 * Represents a type alias declaration, such as `export type X<T> = T | null;`.
 *
 * Written in this order: doc comment, `export` keyword, `type`, name, generics, ` = `, the type, and a semicolon. A
 * type that spans several lines is indented. Unlike classes and methods, the doc comment is written as it is, so the
 * descriptions of the generic parameters are not added to it as `@template` tags.
 *
 * @template TBuilder The type of the source builder the type alias is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsTypeAlias
 */
export class TsTypeAlias<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the type alias, written verbatim after the `type` keyword.
   */
  public name: string;
  /**
   * The doc comment written above the declaration, or `null` to omit it. It is written as given.
   */
  public doc: TsDoc<TBuilder> | null;
  /**
   * The type parameters written in angle brackets after the name, such as `<T, U>`. Null entries are skipped.
   */
  public generics: (TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The aliased type, written after ` = `. It is required.
   */
  public type: TsType<TBuilder>;
  /**
   * Whether the declaration is written with the `export` keyword.
   * @default false
   */
  public export: boolean;

  /**
   * Initializes a new instance of the TsTypeAlias class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.type = options.type;
    this.export = options.export ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.doc) writeTsNode(builder, this.doc);
    if (this.export) builder.append('export ');

    builder.append('type ');
    builder.append(this.name);
    tsGenericParameter.write(builder, this.generics);

    builder.append(' = ');
    builder.indent((b) => {
      writeTsNode(b, this.type);
    });

    builder.append(';');

    builder.appendLine();
  }
}

const createTypeAlias = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  type: Options<TBuilder>['type'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'type'>>,
): TsTypeAlias<TBuilder> => new TsTypeAlias<TBuilder>({ ...options, name, type });

/**
 * Factory for creating type alias nodes. The `write` function writes one or more type alias nodes to a builder.
 *
 * @param name The name of the type alias. See `TsTypeAlias.name`.
 * @param type The aliased type. See `TsTypeAlias.type`.
 * @param options The settings of the type alias. See `TsTypeAlias` for the available properties.
 * @example
 * ```ts
 * tsTypeAlias('X', 'number', { export: true });
 * // Emits:
 * // export type X = number;
 * ```
 */
export const tsTypeAlias: typeof createTypeAlias & { write: typeof writeTsNodes } = Object.assign(createTypeAlias, {
  write: writeTsNodes,
});
