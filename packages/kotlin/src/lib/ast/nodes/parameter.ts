import {
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { type KtAnnotation, ktAnnotation } from './annotation.ts';
import type { KtType, KtValue } from './types.ts';
import type { KtAccessModifier } from '../common.ts';
import { KtNode } from '../node.ts';
import { writeKtNode } from '../utils/write-kt-node.ts';
import { writeKtParameters } from '../utils/write-kt-parameters.ts';

type Injects = 'modifiers' | 'annotations' | 'name' | 'type' | 'default';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    type: KtType<TBuilder>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    default?: Nullable<KtValue<TBuilder>>;
    vararg?: Nullable<boolean>;
    description?: Nullable<BasicAppendValue<TBuilder>>;

    // class parameter options
    accessModifier?: Nullable<KtAccessModifier>;
    property?: Nullable<'readonly' | 'mutable'>;
    propertyDescription?: Nullable<BasicAppendValue<TBuilder>>;
    override?: Nullable<boolean>;
  }
>;

export class KtParameter<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public type: KtType<TBuilder>;
  public annotations: KtAnnotation<TBuilder>[];
  public default: KtValue<TBuilder> | null;
  public vararg: boolean;
  public description: BasicAppendValue<TBuilder> | null;

  // class parameter options
  public accessModifier: KtAccessModifier | null;
  public property: 'readonly' | 'mutable' | null;
  public propertyDescription: BasicAppendValue<TBuilder> | null;
  public override: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.type = options.type;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.default = options.default ?? null;
    this.vararg = options.vararg ?? false;
    this.description = options.description ?? null;

    this.accessModifier = options.accessModifier ?? null;
    this.property = options.property ?? null;
    this.propertyDescription = options.propertyDescription ?? null;
    this.override = options.override ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations, { multiline: true });
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier && this.property) builder.append(this.accessModifier, ' ');
    if (this.override && this.property) builder.append('override ');
    if (this.vararg) builder.append('vararg ');
    builder.append(this.inject.afterModifiers);

    if (this.property) builder.append(this.property === 'mutable' ? 'var' : 'val', ' ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    builder.append(': ');

    builder.append(this.inject.beforeType);
    writeKtNode(builder, this.type);
    builder.append(this.inject.afterType);

    if (this.default) {
      builder.append(' = ');
      builder.append(this.inject.beforeDefault);
      writeKtNode(builder, this.default);
      builder.append(this.inject.afterDefault);
    }
  }
}

const createParameter = <TBuilder extends SourceBuilder>(
  name: KtParameter<TBuilder>['name'],
  type: KtParameter<TBuilder>['type'],
  options?: Prettify<
    Omit<Options<TBuilder>, 'name' | 'type' | 'accessModifier' | 'property' | 'propertyDescription' | 'override'>
  >,
) => new KtParameter<TBuilder>({ ...options, name, type });

const createClassParameter = <TBuilder extends SourceBuilder>(
  name: KtParameter<TBuilder>['name'],
  type: KtParameter<TBuilder>['type'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'type'>>,
) => new KtParameter<TBuilder>({ ...options, name, type });

export const ktParameter = Object.assign(createParameter, {
  class: createClassParameter,
  write: writeKtParameters,
});
