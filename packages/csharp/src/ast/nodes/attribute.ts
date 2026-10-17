import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { CsNode } from '../node.ts';
import { writeCsAttributes } from '../utils/write-cs-attributes.ts';
import { writeCsNode, writeCsNodes } from '../utils/write-cs-node.ts';
import type { CsArgument } from './argument.ts';
import type { CsType, CsValue } from './types.ts';

type Injects = 'name' | 'arguments';

/** The target of an attribute list: `[property: Attr]`. */
export type CsAttributeTarget =
  | 'assembly'
  | 'module'
  | 'field'
  | 'event'
  | 'method'
  | 'param'
  | 'property'
  | 'return'
  | 'type';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    /** The attribute type. Usually a reference; the `Attribute` suffix is omitted. */
    name: CsType<TBuilder>;
    /** Positional constructor arguments (`[Attr(1, "a")]`). Named arguments (`name: value`) are allowed, too. */
    arguments?: Nullable<Nullable<CsArgument<TBuilder> | CsValue<TBuilder>>[]>;
    /** Named property arguments, written after the positional ones (`[Attr(1, Name = "a")]`). `null` values are skipped. */
    properties?: Nullable<Record<string, Nullable<CsValue<TBuilder>>>>;
    target?: Nullable<CsAttributeTarget>;
  }
>;

export class CsAttribute<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public name: CsType<TBuilder>;
  public arguments: (CsArgument<TBuilder> | CsValue<TBuilder>)[];
  public properties: [name: string, value: CsValue<TBuilder>][];
  public target: CsAttributeTarget | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.arguments = options.arguments?.filter(notNullish) ?? [];
    this.properties = Object.entries(options.properties ?? {}).filter(
      (e): e is [string, CsValue<TBuilder>] => e[1] !== null && e[1] !== undefined,
    );
    this.target = options.target ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('[');
    if (this.target) builder.append(this.target, ': ');

    builder.append(this.inject.beforeName);
    writeCsNode(builder, this.name);
    builder.append(this.inject.afterName);

    if (this.arguments.length > 0 || this.properties.length > 0) {
      builder.append(this.inject.beforeArguments);
      builder.parenthesize('()', (b) => {
        writeCsNodes(b, this.arguments, { separator: ', ' });
        if (this.arguments.length > 0 && this.properties.length > 0) b.append(', ');
        b.forEach(this.properties, (b, [name, value]) => b.append(name, ' = ').append((b) => writeCsNode(b, value)), {
          separator: ', ',
        });
      });
      builder.append(this.inject.afterArguments);
    }

    builder.append(']');
  }
}

const createAttribute = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  args?: Options<TBuilder>['arguments'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'arguments'>>,
): CsAttribute<TBuilder> => new CsAttribute<TBuilder>({ ...options, name, arguments: args });

export const csAttribute: typeof createAttribute & { write: typeof writeCsAttributes } = Object.assign(
  createAttribute,
  {
    write: writeCsAttributes,
  },
);
