import {
  AppendValue,
  AstNodeOptions,
  notNullish,
  Nullable,
  Prettify,
  SingleOrMultiple,
  SourceBuilder,
  StringSuggestions,
  toArray,
} from '@goast/core';

import { ktArgument, KtArgument } from './argument';
import { KtReference } from './reference';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    class: AppendValue<TBuilder> | KtReference<TBuilder>;
    arguments?: Nullable<Nullable<KtArgument<TBuilder> | AppendValue<TBuilder>>[]>;
    target?: Nullable<KtAnnotationTarget>;
  }
>;

export type KtAnnotationTarget = StringSuggestions<
  'file' | 'property' | 'field' | 'get' | 'set' | 'receiver' | 'param' | 'setparam' | 'delegate'
>;

export class KtAnnotation<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public class: AppendValue<TBuilder> | KtReference<TBuilder>;
  public arguments: (KtArgument<TBuilder> | AppendValue<TBuilder>)[];
  public target: KtAnnotationTarget | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.class = options.class;
    this.arguments = options.arguments?.filter(notNullish) ?? [];
    this.target = options.target ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .append('@')
      .appendIf(!!this.target, this.target as string | null, ':')
      .append((b) => writeKt(b, this.class))
      .if(this.arguments.length > 0, (b) => ktArgument.write(b, this.arguments));
  }
}

const createAnnotation = <TBuilder extends SourceBuilder>(
  $class: Options<TBuilder>['class'],
  $arguments?: Options<TBuilder>['arguments'],
  options?: Prettify<Omit<Options<TBuilder>, 'class' | 'arguments'>>,
) => new KtAnnotation<TBuilder>({ ...options, class: $class, arguments: $arguments });

const writeAnnotations = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtAnnotation<TBuilder> | AppendValue<TBuilder>>>,
  options?: { multiline: boolean },
) => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, (b, a) => b.append((b) => writeKt(b, a)).if(options?.multiline ?? false, '\n', ' '));
};

export const ktAnnotation = Object.assign(createAnnotation, {
  write: writeAnnotations,
});
