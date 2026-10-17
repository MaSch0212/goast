import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { CsNode } from '../node.ts';
import { writeCsNode, writeCsNodes } from '../utils/write-cs-node.ts';
import { type CsArgument, csArgument } from './argument.ts';
import type { CsType, CsValue } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    /** The created type. If omitted, a target-typed `new(...)` is written. */
    type?: Nullable<CsType<TBuilder>>;
    arguments?: Nullable<Nullable<CsArgument<TBuilder> | CsValue<TBuilder>>[]>;
    /** Object initializer: `{ Name = value }`. Entries whose value is `null` or `undefined` are skipped. */
    properties?: Nullable<Record<string, Nullable<CsValue<TBuilder>>>>;
    /** Collection initializer: `{ a, b }`. */
    items?: Nullable<Nullable<CsValue<TBuilder>>[]>;
  }
>;

export class CsObjectCreation<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public type: CsType<TBuilder> | null;
  public arguments: (CsArgument<TBuilder> | CsValue<TBuilder>)[];
  public properties: [name: string, value: CsValue<TBuilder>][];
  public items: CsValue<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.type = options.type ?? null;
    this.arguments = options.arguments?.filter(notNullish) ?? [];
    this.properties = Object.entries(options.properties ?? {}).filter(
      (e): e is [string, CsValue<TBuilder>] => e[1] !== null && e[1] !== undefined,
    );
    this.items = options.items?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    const hasInitializer = this.properties.length > 0 || this.items.length > 0;

    builder.append('new');
    if (this.type) {
      builder.append(' ');
      writeCsNode(builder, this.type);
    }
    // `new T { ... }` is idiomatic when there are no arguments. A target-typed `new` always needs its parentheses,
    // because `new { ... }` would be an anonymous type.
    if (this.arguments.length > 0 || !hasInitializer || !this.type) {
      csArgument.write(builder, this.arguments);
    }

    if (hasInitializer) {
      const multiline = this.properties.length > 2 || this.items.length > 3;
      if (multiline) {
        builder.ensureCurrentLineEmpty();
      } else {
        builder.append(' ');
      }
      builder.parenthesize(
        multiline ? '{}' : ['{ ', ' }'],
        (b) => {
          b.forEach(this.properties, (b, [name, value]) => b.append(name, ' = ').append((b) => writeCsNode(b, value)), {
            separator: multiline ? ',\n' : ', ',
          });
          if (this.properties.length > 0 && this.items.length > 0) b.append(multiline ? ',\n' : ', ');
          writeCsNodes(b, this.items, { separator: multiline ? ',\n' : ', ' });
        },
        { multiline },
      );
    }
  }
}

const createObjectCreation = <TBuilder extends SourceBuilder>(
  type?: Options<TBuilder>['type'],
  args?: Options<TBuilder>['arguments'],
  options?: Prettify<Omit<Options<TBuilder>, 'type' | 'arguments'>>,
): CsObjectCreation<TBuilder> => new CsObjectCreation<TBuilder>({ ...options, type, arguments: args });

export const csObjectCreation: typeof createObjectCreation & { write: typeof writeCsNodes } = Object.assign(
  createObjectCreation,
  {
    write: writeCsNodes,
  },
);
