import { AstNodeOptions, BasicAppendValue, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { TsType } from './types';
import { TsNode } from '../node';
import { writeTsGenericParameters } from '../utils/write-ts-generic-parameters';
import { writeTsNode } from '../utils/write-ts-nodes';

type Injects = 'modifiers' | 'name' | 'constraint' | 'default';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    description?: Nullable<BasicAppendValue<TBuilder>>;
    const?: Nullable<boolean>;
    name: string;
    constraint?: Nullable<TsType<TBuilder>>;
    default?: Nullable<TsType<TBuilder>>;
  }
>;

export class TsGenericParameter<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public description: BasicAppendValue<TBuilder> | null;
  public const: boolean;
  public name: string;
  public constraint: TsType<TBuilder> | null;
  public default: TsType<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.description = options.description ?? null;
    this.const = options.const ?? false;
    this.name = options.name;
    this.constraint = options.constraint ?? null;
    this.default = options.default ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeModifiers);
    builder.appendIf(this.const, 'const ');
    builder.append(this.inject.afterModifiers);

    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    if (this.constraint !== null) {
      builder.append(' extends ');
      builder.append(this.inject.beforeConstraint);
      writeTsNode(builder, this.constraint);
      builder.append(this.inject.afterConstraint);
    }

    if (this.default !== null) {
      builder.append(' = ');
      builder.append(this.inject.beforeDefault);
      writeTsNode(builder, this.default);
      builder.append(this.inject.afterDefault);
    }
  }
}

const createGenericParameter = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
) => new TsGenericParameter<TBuilder>({ ...options, name });

export const tsGenericParameter = Object.assign(createGenericParameter, {
  write: writeTsGenericParameters,
});
