import type {
  AppendValue,
  AstNodeOptions,
  BasicAppendValue,
  Nullable,
  Prettify,
  SingleOrMultiple,
  SourceBuilder,
} from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsDoc } from './doc.ts';
import type { TsString } from './string.ts';

type Injects = 'doc' | 'name' | 'value';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<TsDoc<TBuilder>>;
    name: string;
    value?: Nullable<TsString<TBuilder> | BasicAppendValue<TBuilder>>;
  }
>;

/**
 * Represents a member of an enum, such as `Active = 1`.
 *
 * Written in this order: the doc comment, the name, then ` = ` and the value when one is set. The enclosing enum
 * separates its members with commas and line breaks.
 *
 * @template TBuilder The type of the source builder the enum value is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsEnumValue
 */
export class TsEnumValue<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The doc comment written above the member, or `null` to omit it.
   */
  public doc: TsDoc<TBuilder> | null;
  /**
   * The name of the member, written verbatim before the value.
   */
  public name: string;
  /**
   * The value written after ` = `, or `null` to write the member without a value, so that TypeScript assigns it. Nodes
   * are written with their own output, and other values are appended as they are.
   */
  public value: TsString<TBuilder> | BasicAppendValue<TBuilder> | null;

  /**
   * Initializes a new instance of the TsEnumValue class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.value = options.value ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    this.doc?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    if (this.value) {
      builder.append(' = ');
      builder.append(this.inject.beforeValue);
      writeTsNode(builder, this.value);
      builder.append(this.inject.afterValue);
    }
  }
}

const createEnumValue = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): TsEnumValue<TBuilder> => new TsEnumValue<TBuilder>({ ...options, name });

const writeEnumValues = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<TsEnumValue<TBuilder> | AppendValue<TBuilder>>>,
): void => {
  writeTsNodes(builder, nodes, { separator: ',\n' });
};

/**
 * Factory for creating enum member nodes. The `write` function writes one or more members to a builder, separated by
 * commas and line breaks.
 *
 * @param name The name of the member.
 * @param options The settings of the member. See `TsEnumValue` for the available properties.
 * @example
 * ```ts
 * tsEnumValue('Active', { value: '1' });
 * // Emits:
 * // Active = 1
 * ```
 */
export const tsEnumValue: typeof createEnumValue & { write: typeof writeEnumValues } = Object.assign(createEnumValue, {
  write: writeEnumValues,
});
