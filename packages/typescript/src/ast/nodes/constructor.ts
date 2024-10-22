import {
  type AppendValue,
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type SourceBuilder,
} from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsConstructorParameter } from './constructor-parameter.ts';
import { type TsDecorator, tsDecorator } from './decorator.ts';
import { type TsDoc, tsDoc } from './doc.ts';
import { tsParameter } from './parameter.ts';

type Injects = 'params' | 'doc' | 'decorators' | 'body';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<TsDoc<TBuilder>>;
    decorators?: Nullable<Nullable<TsDecorator<TBuilder>>[]>;
    parameters?: Nullable<Nullable<TsConstructorParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    body?: Nullable<AppendValue<TBuilder>>;
  }
>;

export class TsConstructor<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public doc: TsDoc<TBuilder> | null;
  public decorators: TsDecorator<TBuilder>[];
  public parameters: (TsConstructorParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public body: AppendValue<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.decorators = options.decorators?.filter(notNullish) ?? [];
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.body = options.body ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    tsDoc.get(this.doc, { parameters: this.parameters })?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeDecorators);
    tsDecorator.write(builder, this.decorators, { multiline: true });
    builder.append(this.inject.afterDecorators);

    builder.append('constructor');
    builder.append(this.inject.beforeParams);
    tsParameter.write(builder, this.parameters);
    builder.append(this.inject.afterParams);
    builder.append(' ');

    builder.append(this.inject.beforeBody);
    builder.parenthesize('{}', this.body, { multiline: !!this.body });
    builder.append(this.inject.afterBody);

    builder.appendLine();
  }
}

const createConstructor = <TBuilder extends SourceBuilder>(options?: Options<TBuilder>) =>
  new TsConstructor<TBuilder>(options ?? {});

export const tsConstructor = Object.assign(createConstructor, {
  write: writeTsNodes,
});
