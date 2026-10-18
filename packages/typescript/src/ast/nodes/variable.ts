import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsDoc } from './doc.ts';
import type { TsType, TsValue } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    doc?: Nullable<TsDoc<TBuilder>>;
    type?: Nullable<TsType<TBuilder>>;
    value?: Nullable<TsValue<TBuilder>>;
    export?: Nullable<boolean>;
    readonly?: Nullable<boolean>;
  }
>;

/**
 * Represents a variable declaration, such as `export const x: number = 42;`.
 *
 * Written in this order: doc comment, `export` keyword, `const` or `let`, name, type annotation, initial value, and a
 * semicolon. A variable is declared with `let` unless `readonly` is set, which declares it with `const`.
 *
 * @template TBuilder The type of the source builder the variable is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsVariable
 */
export class TsVariable<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the variable, written verbatim after `let` or `const`.
   */
  public name: string;
  /**
   * The doc comment written above the declaration, or `null` to omit it. It is written as given.
   */
  public doc: TsDoc<TBuilder> | null;
  /**
   * The type annotation written after the name, such as `: number`, or `null` to omit it.
   */
  public type: TsType<TBuilder> | null;
  /**
   * The initial value written after ` = `, such as ` = 42`, or `null` to omit it. Falsy values are not written.
   */
  public value: TsValue<TBuilder> | null;
  /**
   * Whether the declaration is written with the `export` keyword.
   * @default false
   */
  public export: boolean;
  /**
   * Whether the variable is declared with `const` instead of `let`.
   * @default false
   */
  public readonly: boolean;

  /**
   * Initializes a new instance of the TsVariable class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.type = options.type ?? null;
    this.value = options.value ?? null;
    this.export = options.export ?? false;
    this.readonly = options.readonly ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.doc) writeTsNode(builder, this.doc);
    if (this.export) builder.append('export ');

    builder.append(this.readonly ? 'const ' : 'let ');
    builder.append(this.name);

    if (this.type) {
      builder.append(': ');
      writeTsNode(builder, this.type);
    }

    if (this.value) {
      builder.append(' = ');
      writeTsNode(builder, this.value);
    }

    builder.append(';');

    builder.appendLine();
  }
}

const createVariable = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): TsVariable<TBuilder> => new TsVariable<TBuilder>({ ...options, name });

/**
 * Factory for creating variable nodes. The `write` function writes one or more variable nodes to a builder.
 *
 * @param name The name of the variable. See `TsVariable.name`.
 * @param options The settings of the variable. See `TsVariable` for the available properties.
 * @example
 * ```ts
 * tsVariable('x', { type: 'number', value: 42, readonly: true, export: true });
 * // Emits:
 * // export const x: number = 42;
 * ```
 */
export const tsVariable: typeof createVariable & { write: typeof writeTsNodes } = Object.assign(createVariable, {
  write: writeTsNodes,
});
