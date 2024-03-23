import {
  AppendValue,
  AstNodeOptions,
  Nullable,
  Prettify,
  SingleOrMultiple,
  SourceBuilder,
  StringSuggestions,
  suggestionsAsString,
  toArray,
} from '@goast/core';

import { ktAnnotation, KtAnnotation } from './annotation';
import { ktArgument, KtArgument } from './argument';
import { ktParameter, KtParameter } from './parameter';
import { KotlinFileBuilder } from '../../file-builder';
import { KtAccessModifier } from '../common';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type KtConstructorOptions<TBuilder extends SourceBuilder> = AstNodeOptions<
  KtConstructor<TBuilder>,
  typeof KtNode<TBuilder>,
  never,
  'writeAsPrimary'
>;

export class KtConstructor<
  TBuilder extends SourceBuilder = KotlinFileBuilder,
  TInjects extends string = never
> extends KtNode<TBuilder, TInjects> {
  public accessModifier: KtAccessModifier;
  public annotations: KtAnnotation<TBuilder>[];
  public parameters: KtParameter<TBuilder>[];
  public body: AppendValue<TBuilder>;
  public delegateTarget: StringSuggestions<'this' | 'super'> | null;
  public delegateArguments: (KtArgument<TBuilder> | AppendValue<TBuilder>)[];

  constructor(options: KtConstructorOptions<TBuilder>) {
    super(options);
    this.parameters = options.parameters ?? [];
    this.body = options.body;
    this.accessModifier = options.accessModifier ?? null;
    this.annotations = options.annotations ?? [];
    this.delegateTarget = options.delegateTarget ?? null;
    this.delegateArguments = options.delegateArguments ?? [];
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
        ' '
      )
      .parenthesize('{}', this.body, { multiline: !!this.body })
      .appendLine();
  }

  public writeAsPrimary(builder: TBuilder): void {
    this.writeWithInjects(builder, () => this.onWriteAsPrimary(builder));
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

const createConstructor = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  parameters?: Nullable<KtConstructor<TBuilder>['parameters']>,
  body?: Nullable<KtConstructor<TBuilder>['body']>,
  options?: Prettify<Omit<KtConstructorOptions<TBuilder>, 'parameters' | 'body'>>
) => new KtConstructor<TBuilder>({ ...options, parameters: parameters ?? undefined, body });

const writeConstructors = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  builder: TBuilder,
  constructors: SingleOrMultiple<KtConstructor<TBuilder> | AppendValue<TBuilder>>
) => {
  builder.forEach(toArray(constructors), writeKt, { separator: '\n' });
};

export const ktConstructor = Object.assign(createConstructor, {
  write: writeConstructors,
});
