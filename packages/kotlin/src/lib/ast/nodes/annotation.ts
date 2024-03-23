import {
  AppendValue,
  AstNodeOptions,
  Prettify,
  SingleOrMultiple,
  SourceBuilder,
  StringSuggestions,
  toArray,
} from '@goast/core';

import { ktArgument, KtArgument } from './argument';
import { KotlinFileBuilder } from '../../file-builder';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type KtAnnotationOptions<TBuilder extends SourceBuilder> = AstNodeOptions<
  KtAnnotation<TBuilder>,
  typeof KtNode<TBuilder>,
  'class'
>;

export type KtAnnotationTarget = StringSuggestions<
  'file' | 'property' | 'field' | 'get' | 'set' | 'receiver' | 'param' | 'setparam' | 'delegate'
>;

export class KtAnnotation<
  TBuilder extends SourceBuilder = KotlinFileBuilder,
  TInjects extends string = never
> extends KtNode<TBuilder, TInjects> {
  public class: AppendValue<TBuilder>;
  public arguments: (KtArgument<TBuilder> | AppendValue<TBuilder>)[];
  public target: KtAnnotationTarget | null;

  constructor(options: KtAnnotationOptions<TBuilder>) {
    super(options);
    this.class = options.class;
    this.arguments = options.arguments ?? [];
    this.target = options.target ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .append('@')
      .appendIf(!!this.target, this.target as string | null, ':')
      .append(this.class)
      .if(this.arguments.length > 0, (b) => ktArgument.write(b, this.arguments));
  }
}

const createAnnotation = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  $class: KtAnnotation<TBuilder>['class'],
  $arguments?: KtAnnotation<TBuilder>['arguments'],
  options?: Prettify<Omit<KtAnnotationOptions<TBuilder>, 'class' | 'arguments'>>
) => new KtAnnotation<TBuilder>({ ...options, class: $class, arguments: $arguments });

const writeAnnotations = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  builder: TBuilder,
  annotations: SingleOrMultiple<KtAnnotation<TBuilder> | AppendValue<TBuilder>>,
  options?: { multiline: boolean }
) => {
  builder.forEach(toArray(annotations), (b, a) =>
    b.append((b) => writeKt(b, a)).if(options?.multiline ?? false, '\n', ' ')
  );
};

export const ktAnnotation = Object.assign(createAnnotation, {
  write: writeAnnotations,
});
