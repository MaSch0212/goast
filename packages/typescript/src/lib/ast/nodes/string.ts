import { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { TsNode } from '../node';
import { getTypeScriptBuilderOptions } from '../utils/get-type-script-builder-options';
import { writeTsNodes } from '../utils/write-ts-nodes';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    value: string;
    template?: Nullable<boolean>;
  }
>;

export class TsString<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public value: string;
  public template: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.value = options.value;
    this.template = options.template ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    const builderOptions = getTypeScriptBuilderOptions(builder);
    let value = JSON.stringify(this.value);
    if (this.template) {
      value = `\`${value.slice(1, -1).replace(/`/g, '\\`')}\``;
    } else if (builderOptions.useSingleQuotes) {
      value = `'${value.slice(1, -1).replace(/'/g, "\\'")}'`;
    }
    builder.append(value);
  }
}

const createString = <TBuilder extends SourceBuilder>(
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value'>>,
) => new TsString<TBuilder>({ ...options, value });

export const tsString = Object.assign(createString, {
  write: writeTsNodes,
});
