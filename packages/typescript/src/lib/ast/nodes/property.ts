import { AstNodeOptions, Nullable, Prettify, SourceBuilder, notNullish } from '@goast/core';

import { TsDecorator, tsDecorator } from './decorator';
import { TsDoc, tsDoc } from './doc';
import { TsObject } from './object';
import { TsPropertyGetter, TsPropertySetter, createPropertyGetter, createPropertySetter } from './property-accessor';
import { tsString } from './string';
import { TsType, TsValue } from './types';
import { TsAccessModifier } from '../common';
import { TsNode } from '../node';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes';

type BaseInjects = never;

type BaseOptions<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | BaseInjects>,
  {
    name: string;
    doc?: Nullable<TsDoc<TBuilder>>;
    decorators?: Nullable<Nullable<TsDecorator<TBuilder>>[]>;
    type?: Nullable<TsType<TBuilder>>;
    accessModifier?: Nullable<TsAccessModifier>;
    static?: Nullable<boolean>;
    abstract?: Nullable<boolean>;
    override?: Nullable<boolean>;
  }
>;

type SimpleOptions<TBuilder extends SourceBuilder, TInjects extends string = never> = BaseOptions<
  TBuilder,
  TInjects
> & {
  value?: Nullable<TsValue<TBuilder>>;
  readonly?: Nullable<boolean>;
  optional?: Nullable<boolean>;
};

type AccessorOptions<TBuilder extends SourceBuilder, TInjects extends string = never> = BaseOptions<
  TBuilder,
  TInjects
> & {
  get?: Nullable<TsPropertyGetter<TBuilder>>;
  set?: Nullable<TsPropertySetter<TBuilder>>;
};

export abstract class TsProperty<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | BaseInjects
> {
  public name: string;
  public doc: TsDoc<TBuilder> | null;
  public decorators: TsDecorator<TBuilder>[];
  public type: TsType<TBuilder> | null;
  public accessModifier: TsAccessModifier | null;
  public static: boolean | null;
  public abstract: boolean | null;
  public override: boolean | null;

  constructor(options: BaseOptions<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.decorators = options.decorators?.filter(notNullish) ?? [];
    this.type = options.type ?? null;
    this.accessModifier = options.accessModifier ?? null;
    this.static = options.static ?? null;
    this.abstract = options.abstract ?? null;
    this.override = options.override ?? null;
  }
}

export class TsSimpleProperty<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsProperty<
  TBuilder,
  TInjects
> {
  public value: TsValue<TBuilder> | null;
  public readonly: boolean;
  public optional: boolean;

  constructor(options: SimpleOptions<TBuilder, TInjects>) {
    super(options);
    this.value = options.value ?? null;
    this.readonly = options.readonly ?? false;
    this.optional = options.optional ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    const isInObjectDeclaration = this.getParentNode(builder) instanceof TsObject;

    tsDoc.write(builder, this.doc);
    tsDecorator.write(builder, this.decorators);

    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.static) builder.append('static ');
    if (this.abstract) builder.append('abstract ');
    if (this.override) builder.append('override ');
    if (this.readonly) builder.append('readonly ');

    writeTsNode(builder, /^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(this.name) ? this.name : tsString(this.name));
    if (this.optional) builder.append('?');

    if (this.type && !isInObjectDeclaration) {
      builder.append(': ');
      writeTsNode(builder, this.type);
    }

    if (this.value) {
      builder.append(isInObjectDeclaration ? ': ' : ' = ');
      writeTsNode(builder, this.value);
    }

    builder.append(isInObjectDeclaration ? ',' : ';');

    builder.appendLine();
  }
}

export class TsAccessorProperty<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsProperty<
  TBuilder,
  TInjects
> {
  private _get: TsPropertyGetter<TBuilder> | null = null;
  private _set: TsPropertySetter<TBuilder> | null = null;

  public get get(): TsPropertyGetter<TBuilder> | null {
    return this._get;
  }
  public set get(value: TsPropertyGetter<TBuilder> | null) {
    if (value) {
      value['property'] = this;
    }
    if (this._get) {
      this._get['property'] = undefined;
    }
    this._get = value;
  }

  public get set(): TsPropertySetter<TBuilder> | null {
    return this._set;
  }
  public set set(value: TsPropertySetter<TBuilder> | null) {
    if (value) {
      value['property'] = this;
    }
    if (this._set) {
      this._set['property'] = undefined;
    }
    this._set = value;
  }

  constructor(options: AccessorOptions<TBuilder, TInjects>) {
    super(options);
    this.get = options.get ?? null;
    this.set = options.set ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(
      (b) => tsDoc.write(b, this.doc),
      (b) => tsDecorator.write(b, this.decorators),
    );
    if (this.get) {
      this.get.write(builder);
    }
    if (this.set) {
      this.set.write(builder);
    }
  }
}

const createProperty = <TBuilder extends SourceBuilder>(
  name: BaseOptions<TBuilder>['name'],
  options?: Prettify<Omit<SimpleOptions<TBuilder>, 'name'>> | Prettify<Omit<AccessorOptions<TBuilder>, 'name'>>,
) => {
  if (options && ('get' in options || 'set' in options)) {
    return new TsAccessorProperty({ ...options, name });
  }
  return new TsSimpleProperty({ ...options, name });
};

export const tsProperty = Object.assign(createProperty, {
  write: writeTsNodes,
  getter: createPropertyGetter,
  setter: createPropertySetter,
});
