import {
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { CsNode } from '../node.ts';
import { writeCsAttributes } from '../utils/write-cs-attributes.ts';
import { writeCsNode } from '../utils/write-cs-node.ts';
import { writeCsParameters } from '../utils/write-cs-parameters.ts';
import type { CsAttribute } from './attribute.ts';
import type { CsType, CsValue } from './types.ts';

type Injects = 'attributes' | 'modifiers' | 'type' | 'name' | 'default';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    /** The type of the parameter. Can be omitted for untyped lambda parameters. */
    type?: Nullable<CsType<TBuilder>>;
    description?: Nullable<BasicAppendValue<TBuilder>>;
    attributes?: Nullable<Nullable<CsAttribute<TBuilder>>[]>;
    default?: Nullable<CsValue<TBuilder>>;
    /** The `this` modifier of an extension method's first parameter. */
    this?: Nullable<boolean>;
    /** The `params` modifier. */
    params?: Nullable<boolean>;
    /** A `ref`, `out`, `in` or `ref readonly` modifier. */
    modifier?: Nullable<'ref' | 'out' | 'in' | 'ref readonly'>;
  }
>;

export class CsParameter<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public type: CsType<TBuilder> | null;
  public description: BasicAppendValue<TBuilder> | null;
  public attributes: CsAttribute<TBuilder>[];
  public default: CsValue<TBuilder> | null;
  public this: boolean;
  public params: boolean;
  public modifier: 'ref' | 'out' | 'in' | 'ref readonly' | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.type = options.type ?? null;
    this.description = options.description ?? null;
    this.attributes = options.attributes?.filter(notNullish) ?? [];
    this.default = options.default ?? null;
    this.this = options.this ?? false;
    this.params = options.params ?? false;
    this.modifier = options.modifier ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeAttributes);
    writeCsAttributes(builder, this.attributes, { multiline: false });
    builder.append(this.inject.afterAttributes);

    builder.append(this.inject.beforeModifiers);
    if (this.this) builder.append('this ');
    if (this.modifier) builder.append(this.modifier, ' ');
    if (this.params) builder.append('params ');
    builder.append(this.inject.afterModifiers);

    if (this.type) {
      builder.append(this.inject.beforeType);
      writeCsNode(builder, this.type);
      builder.append(this.inject.afterType, ' ');
    }

    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    if (this.default) {
      builder.append(' = ', this.inject.beforeDefault);
      writeCsNode(builder, this.default);
      builder.append(this.inject.afterDefault);
    }
  }
}

const createParameter = <TBuilder extends SourceBuilder>(
  name: CsParameter<TBuilder>['name'],
  type?: CsParameter<TBuilder>['type'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'type'>>,
): CsParameter<TBuilder> => new CsParameter<TBuilder>({ ...options, name, type });

export const csParameter: typeof createParameter & { write: typeof writeCsParameters } = Object.assign(
  createParameter,
  {
    write: writeCsParameters,
  },
);
