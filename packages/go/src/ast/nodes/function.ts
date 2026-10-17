import {
  type AppendValue,
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { GoNode } from '../node.ts';
import { writeGoNodes } from '../utils/write-go-node.ts';
import type { GoDoc } from './doc.ts';
import { type GoParameter, goParameter } from './parameter.ts';

type Injects = 'doc' | 'receiver' | 'name' | 'parameters' | 'results' | 'body';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    doc?: Nullable<GoDoc<TBuilder>>;
    /** The receiver, which makes the function a method. */
    receiver?: Nullable<GoParameter<TBuilder>>;
    typeParameters?: Nullable<Nullable<GoParameter<TBuilder>>[]>;
    parameters?: Nullable<Nullable<GoParameter<TBuilder>>[]>;
    results?: Nullable<Nullable<GoParameter<TBuilder>>[]>;
    /** The statements of the body, without braces. */
    body?: Nullable<AppendValue<TBuilder>>;
  }
>;

/** A function or method declaration. */
export class GoFunction<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public doc: GoDoc<TBuilder> | null;
  public receiver: GoParameter<TBuilder> | null;
  public typeParameters: GoParameter<TBuilder>[];
  public parameters: GoParameter<TBuilder>[];
  public results: GoParameter<TBuilder>[];
  public body: AppendValue<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.receiver = options.receiver ?? null;
    this.typeParameters = options.typeParameters?.filter(notNullish) ?? [];
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.results = options.results?.filter(notNullish) ?? [];
    this.body = options.body ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    this.doc?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append('func ');
    if (this.receiver) {
      builder.append(this.inject.beforeReceiver);
      goParameter.writeList(builder, [this.receiver]);
      builder.append(this.inject.afterReceiver, ' ');
    }
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);
    if (this.typeParameters.length > 0) {
      builder.parenthesize('[]', (b) => writeGoNodes(b, this.typeParameters, { separator: ', ' }));
    }
    builder.append(this.inject.beforeParameters);
    goParameter.writeList(builder, this.parameters);
    builder.append(this.inject.afterParameters);
    if (this.results.length > 0) {
      builder.append(' ', this.inject.beforeResults);
      goParameter.writeList(builder, this.results, { results: true });
      builder.append(this.inject.afterResults);
    }

    builder.append(' ', this.inject.beforeBody);
    if (this.body === null) {
      builder.append('{}');
    } else {
      builder.parenthesize('{}', this.body, { multiline: true });
    }
    builder.append(this.inject.afterBody);
    builder.appendLine();
  }
}

const createFunction = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): GoFunction<TBuilder> => new GoFunction<TBuilder>({ ...options, name });

export const goFunction: typeof createFunction & { write: typeof writeGoNodes } = Object.assign(createFunction, {
  write: writeGoNodes,
});
