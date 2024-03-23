/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SourceBuilder, AppendValue, AstNodeOptions, Prettify, SingleOrMultiple, toArray } from '@goast/core';

import { ktAnnotation, KtAnnotation } from './annotation';
import { ktArgument } from './argument';
import { KtDoc } from './doc';
import { KtReference } from './reference';
import { KotlinFileBuilder } from '../../file-builder';
import { KtAccessModifier } from '../common';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type KtPropertyAccessorOptions<TBuilder extends SourceBuilder> = AstNodeOptions<
  KtPropertyAccessor<TBuilder>,
  typeof KtNode<TBuilder>,
  never,
  'kind'
>;

export abstract class KtPropertyAccessor<
  TBuilder extends SourceBuilder = KotlinFileBuilder,
  TInjects extends string = never
> extends KtNode<TBuilder, TInjects> {
  public abstract get kind(): 'get' | 'set';
  public accessModifier: KtAccessModifier;
  public annotations: KtAnnotation<TBuilder>[];
  public body: AppendValue<TBuilder>;
  public singleExpression: boolean;

  constructor(options: KtPropertyAccessorOptions<TBuilder>) {
    super(options);
    this.accessModifier = options.accessModifier ?? null;
    this.annotations = options.annotations ?? [];
    this.body = options.body;
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
            (b) => b.append(' ').parenthesize('{}', this.body, { multiline: true })
          )
      );
  }
}
export class KtPropertyGetter<TBuilder extends SourceBuilder = KotlinFileBuilder> extends KtPropertyAccessor<TBuilder> {
  public override readonly kind = 'get';
}
export class KtPropertySetter<TBuilder extends SourceBuilder = KotlinFileBuilder> extends KtPropertyAccessor<TBuilder> {
  public override readonly kind = 'set';
}

type KtPropertyOptions<TBuilder extends SourceBuilder> = AstNodeOptions<
  KtProperty<TBuilder>,
  typeof KtNode<TBuilder>,
  'name'
>;

export class KtProperty<TBuilder extends SourceBuilder = KotlinFileBuilder> extends KtNode<TBuilder> {
  public doc: KtDoc<TBuilder> | null;
  public name: string;
  public type: AppendValue<TBuilder>;
  public annotations: KtAnnotation<TBuilder>[];
  public accessModifier: KtAccessModifier;
  public getter: KtPropertyGetter<TBuilder> | null;
  public setter: KtPropertySetter<TBuilder> | null;
  public default: AppendValue<TBuilder>;
  public delegate: KtReference<TBuilder> | AppendValue<TBuilder>;
  public delegateArguments: AppendValue<TBuilder>[] | null;
  public mutable: boolean;
  public const: boolean;
  public lateinit: boolean;
  public open: boolean;
  public override: boolean;
  public abstract: boolean;

  constructor(options: KtPropertyOptions<TBuilder>) {
    super(options);
    this.doc = options.doc ?? null;
    this.name = options.name;
    this.type = options.type;
    this.annotations = options.annotations ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.getter = options.getter ?? null;
    this.setter = options.setter ?? null;
    this.default = options.default;
    this.delegate = options.delegate;
    this.delegateArguments = options.delegateArguments ?? null;
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
      .appendIf(!!this.type || (!this.default && !this.getter?.body), ': ', this.type ? this.type : 'Any?')
      .appendIf(!!this.default, ' = ', this.default)
      .appendIf(
        !!this.delegate,
        ' by ',
        (b) => writeKt(b, this.delegate),
        this.delegateArguments ? (b) => ktArgument.write(b, this.delegateArguments) : null
      )
      .indent((b) =>
        b
          .appendIf(!!this.getter, '\n', (b) => this.getter?.write(b))
          .appendIf(!!this.setter, '\n', (b) => this.setter?.write(b))
      )
      .appendLine();
  }
}

const createPropertyGetter = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  options?: KtPropertyAccessorOptions<TBuilder>
) => new KtPropertyGetter<TBuilder>(options ?? {});

const createPropertySetter = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  options?: KtPropertyAccessorOptions<TBuilder>
) => new KtPropertySetter<TBuilder>(options ?? {});

const createProperty = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  name: KtProperty<TBuilder>['name'],
  options?: Prettify<Omit<KtPropertyOptions<TBuilder>, 'name'>>
) => new KtProperty<TBuilder>({ ...options, name });

const writeProperties = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  builder: TBuilder,
  properties: SingleOrMultiple<KtProperty<TBuilder> | AppendValue<TBuilder>>
) => {
  builder.forEach(toArray(properties), writeKt, { separator: '\n' });
};

export const ktProperty = Object.assign(createProperty, {
  getter: createPropertyGetter,
  setter: createPropertySetter,
  write: writeProperties,
});
