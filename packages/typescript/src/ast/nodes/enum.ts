import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsDoc } from './doc.ts';
import { type TsEnumValue, tsEnumValue } from './enum-value.ts';

type Injects = 'doc' | 'modifiers' | 'name' | 'body' | 'members';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<TsDoc<TBuilder>>;
    export?: Nullable<boolean>;
    const?: Nullable<boolean>;
    name: string;
    members?: Nullable<Nullable<TsEnumValue<TBuilder>>[]>;
  }
>;

export class TsEnum<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public doc: TsDoc<TBuilder> | null;
  public export: boolean;
  public const: boolean;
  public name: string;
  public members: TsEnumValue<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.export = options.export ?? false;
    this.const = options.const ?? false;
    this.name = options.name;
    this.members = options.members?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    this.doc?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeModifiers);
    if (this.export) builder.append('export ');
    if (this.const) builder.append('const ');
    builder.append(this.inject.afterModifiers);

    builder.append('enum ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);
    builder.append(' ');

    builder.append(this.inject.beforeBody);
    builder.parenthesize(
      '{}',
      (b) => {
        b.append(this.inject.beforeMembers);
        tsEnumValue.write(b, this.members);
        b.append(this.inject.afterMembers);
      },
      { multiline: this.members.length > 0 },
    );
    builder.append(this.inject.afterBody);

    builder.appendLine();
  }
}

const createEnum = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
) => new TsEnum<TBuilder>({ ...options, name });

export const tsEnum = Object.assign(createEnum, {
  write: writeTsNodes,
});
