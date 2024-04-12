import { SourceBuilder, AstNodeOptions, Nullable, notNullish } from '@goast/core';

import { ktParameter } from './parameter';
import { KtType } from './types';
import { KtNode } from '../node';
import { writeKtNode, writeKtNodes } from '../utils/write-kt-node';

type Injects = 'extensionFor' | 'params' | 'returnType';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    extensionFor?: Nullable<KtType<TBuilder>>;
    parameters?: Nullable<Nullable<KtType<TBuilder>>[]>;
    returnType: KtType<TBuilder>;
  }
>;

export class KtLambdaType<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public extensionFor: KtType<TBuilder> | null;
  public parameters: KtType<TBuilder>[];
  public returnType: KtType<TBuilder>;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.extensionFor = options.extensionFor ?? null;
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.returnType = options.returnType;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.extensionFor) {
      builder.append(this.inject.beforeExtensionFor);
      writeKtNode(builder, this.extensionFor);
      builder.append(this.inject.afterExtensionFor);
      builder.append('.');
    }

    builder.append(this.inject.beforeParams);
    if (this.parameters.length === 0) {
      builder.append('()');
    } else if (this.parameters.length === 1 && !this.extensionFor) {
      writeKtNode(builder, this.parameters[0]);
    } else {
      ktParameter.write(builder, this.parameters);
    }
    builder.append(this.inject.afterParams);

    builder.append(' -> ');

    builder.append(this.inject.beforeReturnType);
    writeKtNode(builder, this.returnType);
    builder.append(this.inject.afterReturnType);
  }
}

const createLambdaType = <TBuilder extends SourceBuilder>(
  parameters: Options<TBuilder>['parameters'],
  returnType: Options<TBuilder>['returnType'],
  options?: Omit<Options<TBuilder>, 'parameters' | 'returnType'>,
) => new KtLambdaType<TBuilder>({ ...options, parameters, returnType });

export const ktLambdaType = Object.assign(createLambdaType, {
  write: writeKtNodes,
});
