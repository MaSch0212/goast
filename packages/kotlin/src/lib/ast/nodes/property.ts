/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  SourceBuilder,
  AppendValue,
  AstNodeOptions,
  Prettify,
  SingleOrMultiple,
  toArray,
  notNullish,
  Nullable,
} from '@goast/core';

import { ktAnnotation, KtAnnotation } from './annotation';
import { ktArgument } from './argument';
import { KtDoc } from './doc';
import { KtReference } from './reference';
import { KtAccessModifier } from '../common';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type AccessorInjects = never;

type AccessorOptions<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | AccessorInjects>,
  {
    accessModifier?: Nullable<KtAccessModifier>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    body?: Nullable<AppendValue<TBuilder>>;
    singleExpression?: Nullable<boolean>;
  }
>;

export abstract class KtPropertyAccessor<
  TBuilder extends SourceBuilder,
  TInjects extends string = never,
> extends KtNode<TBuilder, TInjects | AccessorInjects> {
  public abstract get kind(): 'get' | 'set';
  public accessModifier: KtAccessModifier | null;
  public annotations: KtAnnotation<TBuilder>[];
  public body: AppendValue<TBuilder> | null;
  public singleExpression: boolean;

  constructor(options: AccessorOptions<TBuilder, TInjects>) {
    super(options);
    this.accessModifier = options.accessModifier ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.body = options.body ?? null;
    this.singleExpression = options.singleExpression ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .append((b) => ktAnnotation.write(b, this.annotations, { multiline: true }))
      .appendIf(!!this.accessModifier, this.accessModifier, ' ')
      .append(this.kind)
      .appendIf(!!this.body, (b) =>
        b
          .parenthesize('()', (b) => b.appendIf(this.kind === 'set', 'value'))
          .if(
            this.singleExpression,
            (b) => b.append(' = ', this.body),
            (b) => b.append(' ').parenthesize('{}', this.body, { multiline: true }),
          ),
      );
  }
}
export class KtPropertyGetter<TBuilder extends SourceBuilder> extends KtPropertyAccessor<TBuilder> {
  public override readonly kind = 'get';
}
export class KtPropertySetter<TBuilder extends SourceBuilder> extends KtPropertyAccessor<TBuilder> {
  public override readonly kind = 'set';
}

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<KtDoc<TBuilder>>;
    name: string;
    type?: AppendValue<TBuilder> | KtReference<TBuilder>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    accessModifier?: Nullable<KtAccessModifier>;
    getter?: Nullable<KtPropertyGetter<TBuilder>>;
    setter?: Nullable<KtPropertySetter<TBuilder>>;
    default?: Nullable<AppendValue<TBuilder>>;
    delegate?: Nullable<KtReference<TBuilder> | AppendValue<TBuilder>>;
    delegateArguments?: Nullable<Nullable<AppendValue<TBuilder>>[]>;
    mutable?: Nullable<boolean>;
    const?: Nullable<boolean>;
    lateinit?: Nullable<boolean>;
    open?: Nullable<boolean>;
    override?: Nullable<boolean>;
    abstract?: Nullable<boolean>;
  }
>;

export class KtProperty<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public doc: KtDoc<TBuilder> | null;
  public name: string;
  public type: AppendValue<TBuilder> | KtReference<TBuilder> | null;
  public annotations: KtAnnotation<TBuilder>[];
  public accessModifier: KtAccessModifier | null;
  public getter: KtPropertyGetter<TBuilder> | null;
  public setter: KtPropertySetter<TBuilder> | null;
  public default: AppendValue<TBuilder> | null;
  public delegate: KtReference<TBuilder> | AppendValue<TBuilder> | null;
  public delegateArguments: AppendValue<TBuilder>[] | null;
  public mutable: boolean;
  public const: boolean;
  public lateinit: boolean;
  public open: boolean;
  public override: boolean;
  public abstract: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.name = options.name;
    this.type = options.type ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.getter = options.getter ?? null;
    this.setter = options.setter ?? null;
    this.default = options.default ?? null;
    this.delegate = options.delegate ?? null;
    this.delegateArguments = options.delegateArguments?.filter(notNullish) ?? null;
    this.mutable = options.mutable ?? false;
    this.const = options.const ?? false;
    this.lateinit = options.lateinit ?? false;
    this.open = options.open ?? false;
    this.override = options.override ?? false;
    this.abstract = options.abstract ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .append((b) => this.doc?.write(b))
      .append((b) => ktAnnotation.write(b, this.annotations, { multiline: true }))
      .appendIf(!!this.accessModifier, this.accessModifier, ' ')
      .appendIf(this.const, 'const ')
      .appendIf(this.lateinit, 'lateinit ')
      .appendIf(this.abstract, 'abstract ')
      .appendIf(this.override, 'override ')
      .appendIf(this.open, 'open ')
      .if(this.mutable || !!this.setter, 'var ', 'val ')
      .append(this.name)
      .appendIf(
        !!this.type || (!this.default && !this.getter?.body),
        ': ',
        this.type ? (b) => writeKt(b, this.type) : 'Any?',
      )
      .appendIf(!!this.default, ' = ', this.default)
      .appendIf(
        !!this.delegate,
        ' by ',
        (b) => writeKt(b, this.delegate),
        this.delegateArguments ? (b) => ktArgument.write(b, this.delegateArguments) : null,
      )
      .indent((b) =>
        b
          .appendIf(!!this.getter, '\n', (b) => this.getter?.write(b))
          .appendIf(!!this.setter, '\n', (b) => this.setter?.write(b)),
      )
      .appendLine();
  }
}

const createPropertyGetter = <TBuilder extends SourceBuilder>(options?: AccessorOptions<TBuilder>) =>
  new KtPropertyGetter<TBuilder>(options ?? {});

const createPropertySetter = <TBuilder extends SourceBuilder>(options?: AccessorOptions<TBuilder>) =>
  new KtPropertySetter<TBuilder>(options ?? {});

const createProperty = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
) => new KtProperty<TBuilder>({ ...options, name });

const writeProperties = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtProperty<TBuilder> | AppendValue<TBuilder>>>,
) => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, writeKt, { separator: '\n' });
};

export const ktProperty = Object.assign(createProperty, {
  getter: createPropertyGetter,
  setter: createPropertySetter,
  write: writeProperties,
});
