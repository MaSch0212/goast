import { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { tsDecorator } from './decorator';
import { TsParameter } from './parameter';
import { TsAccessModifier } from '../common';
import { writeTsNode } from '../utils/write-ts-nodes';
import { writeTsParameters } from '../utils/write-ts-parameters';

type Injects = 'modifiers';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsParameter<TBuilder, TInjects | Injects>,
  {
    accessModifier?: Nullable<TsAccessModifier>;
    readonly?: Nullable<boolean>;
  }
>;

export class TsConstructorParameter<
  TBuilder extends SourceBuilder,
  TInjects extends string = never,
> extends TsParameter<TBuilder, TInjects | Injects> {
  public accessModifier: TsAccessModifier | null;
  public readonly: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.accessModifier = options.accessModifier ?? null;
    this.readonly = options.readonly ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDecorators);
    tsDecorator.write(builder, this.decorators);
    builder.append(this.inject.afterDecorators);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.readonly) builder.append('readonly ');
    builder.append(this.inject.afterModifiers);

    builder.append(this.inject.beforeName, this.name, this.inject.afterName);
    if (this.optional) builder.append('?');

    if (this.type) {
      builder.append(': ');
      builder.append(this.inject.beforeType);
      writeTsNode(builder, this.type);
      builder.append(this.inject.afterType);
    }

    if (this.default) {
      builder.append(' = ');
      builder.append(this.inject.beforeDefault);
      writeTsNode(builder, this.default);
      builder.append(this.inject.afterDefault);
    }
  }
}

const createConstructorParameter = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
) => new TsConstructorParameter<TBuilder>({ ...options, name });

export const tsConstructorParameter = Object.assign(createConstructorParameter, {
  write: writeTsParameters,
});
