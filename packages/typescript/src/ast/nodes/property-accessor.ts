import { type AppendValue, type AstNodeOptions, notNullish, type Nullable, type SourceBuilder } from '@goast/core';

import type { TsAccessModifier } from '../common.ts';
import { TsNode } from '../node.ts';
import { writeTsNode } from '../utils/write-ts-nodes.ts';
import { type TsDecorator, tsDecorator } from './decorator.ts';
import { type TsDoc, tsDoc } from './doc.ts';
import type { TsProperty } from './property.ts';
import type { TsType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    propertyName?: Nullable<string>;
    doc?: Nullable<TsDoc<TBuilder>>;
    type?: Nullable<TsType<TBuilder>>;
    decorators?: Nullable<Nullable<TsDecorator<TBuilder>>[]>;
    body?: Nullable<AppendValue<TBuilder>>;
    accessModifier?: Nullable<TsAccessModifier>;
    static?: Nullable<boolean>;
    abstract?: Nullable<boolean>;
    override?: Nullable<boolean>;
  }
>;

abstract class TsPropertyAccessor<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  private _propertyName: string | null;
  private _type: TsType<TBuilder> | null;
  private _accessModifier: TsAccessModifier | null;
  private _static: boolean;
  private _abstract: boolean;
  private _override: boolean;

  public doc: TsDoc<TBuilder> | null;
  public decorators: TsDecorator<TBuilder>[];
  public body: AppendValue<TBuilder> | null;

  public get propertyName(): string {
    return this.property?.name ?? this._propertyName ?? 'someProperty';
  }
  public set propertyName(value: string | null) {
    this._propertyName = value;
  }

  public get type(): TsType<TBuilder> | null {
    return this.property?.type ?? this._type;
  }
  public set type(value: TsType<TBuilder> | null) {
    this._type = value;
  }

  public get accessModifier(): TsAccessModifier | null {
    return this.property?.accessModifier ?? this._accessModifier;
  }
  public set accessModifier(value: TsAccessModifier | null) {
    this._accessModifier = value;
  }

  public get static(): boolean {
    return this.property?.static ?? this._static;
  }
  public set static(value: boolean) {
    this._static = value;
  }

  public get abstract(): boolean {
    return this.property?.abstract ?? this._abstract;
  }
  public set abstract(value: boolean) {
    this._abstract = value;
  }

  public get override(): boolean {
    return this.property?.override ?? this._override;
  }
  public set override(value: boolean) {
    this._override = value;
  }

  protected property?: TsProperty<TBuilder>;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this._propertyName = options.propertyName ?? null;
    this.doc = options.doc ?? null;
    this._type = options.type ?? null;
    this.decorators = options.decorators?.filter(notNullish) ?? [];
    this.body = options.body ?? null;
    this._accessModifier = options.accessModifier ?? null;
    this._static = options.static ?? false;
    this._abstract = options.abstract ?? false;
    this._override = options.override ?? false;
  }
}

export class TsPropertySetter<TBuilder extends SourceBuilder, TInjects extends string = never>
  extends TsPropertyAccessor<
    TBuilder,
    TInjects
  > {
  protected override onWrite(builder: TBuilder): void {
    tsDoc.write(builder, this.doc);
    tsDecorator.write(builder, this.decorators);

    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.static) builder.append('static ');
    if (this.abstract) builder.append('abstract ');
    if (this.override) builder.append('override ');

    builder.append('set ', this.propertyName);
    builder.parenthesize('()', (b) => {
      b.append('value');
      if (this.type !== null) {
        b.append(': ');
        writeTsNode(b, this.type);
      }
    });

    if (this.body !== null) {
      builder.append(' ');
      builder.parenthesize('{}', this.body, { multiline: true });
    } else {
      builder.append(';');
    }

    builder.appendLine();
  }
}

export class TsPropertyGetter<TBuilder extends SourceBuilder, TInjects extends string = never>
  extends TsPropertyAccessor<
    TBuilder,
    TInjects
  > {
  protected override onWrite(builder: TBuilder): void {
    tsDoc.write(builder, this.doc);
    tsDecorator.write(builder, this.decorators);

    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.static) builder.append('static ');
    if (this.abstract) builder.append('abstract ');
    if (this.override) builder.append('override ');

    builder.append('get ', this.propertyName, '()');

    if (this.type) {
      builder.append(': ');
      writeTsNode(builder, this.type);
    }

    if (this.body !== null) {
      builder.append(' ');
      builder.parenthesize('{}', this.body, { multiline: true });
    } else {
      builder.append(';');
    }

    builder.appendLine();
  }
}

export const createPropertySetter = <TBuilder extends SourceBuilder>(
  options?: Options<TBuilder>,
): TsPropertySetter<TBuilder> => new TsPropertySetter<TBuilder>(options ?? {});

export const createPropertyGetter = <TBuilder extends SourceBuilder>(
  options?: Options<TBuilder>,
): TsPropertyGetter<TBuilder> => new TsPropertyGetter<TBuilder>(options ?? {});
