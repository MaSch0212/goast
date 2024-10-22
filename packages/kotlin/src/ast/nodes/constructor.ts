import {
  type AppendValue,
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import type { KtAccessModifier } from '../common.ts';
import { KtNode } from '../node.ts';
import { writeKtNodes } from '../utils/write-kt-node.ts';
import { type KtAnnotation, ktAnnotation } from './annotation.ts';
import { type KtArgument, ktArgument } from './argument.ts';
import { type KtParameter, ktParameter } from './parameter.ts';
import type { KtValue } from './types.ts';

type Injects = 'annotations' | 'modifiers' | 'params' | 'body' | 'delegate';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    accessModifier?: Nullable<KtAccessModifier>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    parameters?: Nullable<Nullable<KtParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    body?: Nullable<AppendValue<TBuilder>>;
    delegateTarget?: Nullable<KtDelegateTarget>;
    delegateArguments?: Nullable<Nullable<KtArgument<TBuilder> | KtValue<TBuilder>>[]>;
  }
>;

export type KtDelegateTarget = 'this' | 'super';

export class KtConstructor<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public accessModifier: KtAccessModifier | null;
  public annotations: KtAnnotation<TBuilder>[];
  public parameters: (KtParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public body: AppendValue<TBuilder> | null;
  public delegateTarget: KtDelegateTarget | null;
  public delegateArguments: (KtArgument<TBuilder> | KtValue<TBuilder>)[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.body = options.body ?? null;
    this.accessModifier = options.accessModifier ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.delegateTarget = options.delegateTarget ?? null;
    this.delegateArguments = options.delegateArguments?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations, { multiline: true });
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    builder.append(this.inject.afterModifiers);

    builder.append('constructor');

    builder.append(this.inject.beforeParams);
    ktParameter.write(builder, this.parameters);
    builder.append(this.inject.afterParams);

    if (this.delegateTarget) {
      builder.append(' : ');
      builder.append(this.inject.beforeDelegate);
      builder.append(this.delegateTarget);
      ktArgument.write(builder, this.delegateArguments);
      builder.append(this.inject.afterDelegate);
    }

    builder.append(' ');
    builder.append(this.inject.beforeBody);
    builder.parenthesize('{}', this.body, { multiline: !!this.body });
    builder.append(this.inject.afterBody);

    builder.appendLine();
  }

  public writeAsPrimary(builder: TBuilder): void {
    builder.append(this.inject.before);
    this.onWriteAsPrimary(builder);
    builder.append(this.inject.after);
  }

  protected onWriteAsPrimary(builder: TBuilder): void {
    const needsCtorKeyword = this.annotations.length > 0 || !!this.accessModifier;
    if (needsCtorKeyword) builder.append(' ');

    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations);
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    builder.append(this.inject.afterModifiers);

    if (needsCtorKeyword) builder.append('constructor');

    if (needsCtorKeyword || this.parameters.length > 0) {
      builder.append(this.inject.beforeParams);
      ktParameter.write(builder, this.parameters);
      builder.append(this.inject.afterParams);
    }
  }
}

const createConstructor = <TBuilder extends SourceBuilder>(
  parameters?: Options<TBuilder>['parameters'],
  body?: Options<TBuilder>['body'],
  options?: Prettify<Omit<Options<TBuilder>, 'parameters' | 'body'>>,
) => new KtConstructor<TBuilder>({ ...options, parameters: parameters ?? undefined, body });

export const ktConstructor = Object.assign(createConstructor, {
  write: writeKtNodes,
});
