import {
  AppendValue,
  AstNodeOptions,
  notNullish,
  Nullable,
  Prettify,
  SingleOrMultiple,
  SourceBuilder,
  suggestionsAsString,
  toArray,
} from '@goast/core';

import { ktAnnotation, KtAnnotation } from './annotation';
import { ktArgument, KtArgument } from './argument';
import { ktParameter, KtParameter } from './parameter';
import { KtAccessModifier } from '../common';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    accessModifier?: Nullable<KtAccessModifier>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    parameters?: Nullable<Nullable<KtParameter<TBuilder>>[]>;
    body?: Nullable<AppendValue<TBuilder>>;
    delegateTarget?: Nullable<DelegateTarget>;
    delegateArguments?: Nullable<Nullable<KtArgument<TBuilder> | AppendValue<TBuilder>>[]>;
  }
>;

type DelegateTarget = 'this' | 'super';

export class KtConstructor<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public accessModifier: KtAccessModifier | null;
  public annotations: KtAnnotation<TBuilder>[];
  public parameters: KtParameter<TBuilder>[];
  public body: AppendValue<TBuilder> | null;
  public delegateTarget: DelegateTarget | null;
  public delegateArguments: (KtArgument<TBuilder> | AppendValue<TBuilder>)[];

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
    builder
      .append((b) => ktAnnotation.write(b, this.annotations, { multiline: true }))
      .appendIf(!!this.accessModifier, this.accessModifier, ' ')
      .append('constructor', (b) => ktParameter.write(b, this.parameters), ' ')
      .appendIf(
        !!this.delegateTarget,
        ': ',
        suggestionsAsString(this.delegateTarget),
        (b) => ktArgument.write(b, this.delegateArguments),
        ' ',
      )
      .parenthesize('{}', this.body, { multiline: !!this.body })
      .appendLine();
  }

  public writeAsPrimary(builder: TBuilder): void {
    builder.append(this.inject.before);
    this.onWriteAsPrimary(builder);
    builder.append(this.inject.after);
  }

  protected onWriteAsPrimary(builder: TBuilder): void {
    const needsCtorKeyword = this.annotations.length > 0 || !!this.accessModifier;
    builder
      .appendIf(needsCtorKeyword, ' ')
      .append((b) => ktAnnotation.write(b, this.annotations))
      .appendIf(!!this.accessModifier, this.accessModifier, ' ')
      .appendIf(needsCtorKeyword, 'constructor')
      .appendIf(needsCtorKeyword || this.parameters.length > 0, (b) => ktParameter.write(b, this.parameters));
  }
}

const createConstructor = <TBuilder extends SourceBuilder>(
  parameters?: Options<TBuilder>['parameters'],
  body?: Options<TBuilder>['body'],
  options?: Prettify<Omit<Options<TBuilder>, 'parameters' | 'body'>>,
) => new KtConstructor<TBuilder>({ ...options, parameters: parameters ?? undefined, body });

const writeConstructors = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtConstructor<TBuilder> | AppendValue<TBuilder>>>,
) => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, writeKt, { separator: '\n' });
};

export const ktConstructor = Object.assign(createConstructor, {
  write: writeConstructors,
});
