import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import type { CsAccessModifier } from '../common.ts';
import { CsNode } from '../node.ts';
import { writeCsAttributes } from '../utils/write-cs-attributes.ts';
import { writeCsNode, writeCsNodes } from '../utils/write-cs-node.ts';
import type { CsAttribute } from './attribute.ts';
import type { CsDoc } from './doc.ts';
import type { CsType, CsValue } from './types.ts';

type Injects = 'doc' | 'attributes' | 'modifiers' | 'type' | 'name' | 'initializer';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<CsDoc<TBuilder>>;
    name: string;
    type: CsType<TBuilder>;
    attributes?: Nullable<Nullable<CsAttribute<TBuilder>>[]>;
    accessModifier?: Nullable<CsAccessModifier>;
    initializer?: Nullable<CsValue<TBuilder>>;
    static?: Nullable<boolean>;
    readonly?: Nullable<boolean>;
    const?: Nullable<boolean>;
  }
>;

export class CsField<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public doc: CsDoc<TBuilder> | null;
  public name: string;
  public type: CsType<TBuilder>;
  public attributes: CsAttribute<TBuilder>[];
  public accessModifier: CsAccessModifier | null;
  public initializer: CsValue<TBuilder> | null;
  public static: boolean;
  public readonly: boolean;
  public const: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.name = options.name;
    this.type = options.type;
    this.attributes = options.attributes?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.initializer = options.initializer ?? null;
    this.static = options.static ?? false;
    this.readonly = options.readonly ?? false;
    this.const = options.const ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    this.doc?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAttributes);
    writeCsAttributes(builder, this.attributes, { multiline: true });
    builder.append(this.inject.afterAttributes);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.static) builder.append('static ');
    if (this.readonly) builder.append('readonly ');
    if (this.const) builder.append('const ');
    builder.append(this.inject.afterModifiers);

    builder.append(this.inject.beforeType);
    writeCsNode(builder, this.type);
    builder.append(this.inject.afterType, ' ');

    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    if (this.initializer) {
      builder.append(' = ', this.inject.beforeInitializer);
      writeCsNode(builder, this.initializer);
      builder.append(this.inject.afterInitializer);
    }

    builder.appendLine(';');
  }
}

const createField = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options: Prettify<Omit<Options<TBuilder>, 'name'>>,
): CsField<TBuilder> => new CsField<TBuilder>({ ...options, name });

export const csField: typeof createField & { write: typeof writeCsNodes } = Object.assign(createField, {
  write: writeCsNodes,
});
