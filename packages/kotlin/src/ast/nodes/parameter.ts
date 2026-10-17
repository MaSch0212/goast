import {
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import type { KtAccessModifier } from '../common.ts';
import { KtNode } from '../node.ts';
import { writeKtNode } from '../utils/write-kt-node.ts';
import { writeKtParameters } from '../utils/write-kt-parameters.ts';
import { type KtAnnotation, ktAnnotation } from './annotation.ts';
import type { KtType, KtValue } from './types.ts';

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

/**
 * Represents a Kotlin parameter of a function or a class constructor. A class constructor parameter can also declare
 * a property.
 *
 * Written in this order: the annotations, each on a line of its own, the modifiers, `val` or `var` for a property, the
 * name, the type after a colon, then the default value after an equals sign.
 *
 * @template TBuilder The type of the source builder the parameter is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktParameter
 */
export class KtParameter<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the parameter, written before the colon.
   */
  public name: string;
  /**
   * The type of the parameter, written after the colon, such as `Int` in `x: Int`.
   */
  public type: KtType<TBuilder>;
  /**
   * The annotations written above the parameter, each on a line of its own. A parameter list with annotations is
   * written with one parameter per line.
   */
  public annotations: KtAnnotation<TBuilder>[];
  /**
   * The default value written after ` = `, such as `42` in `x: Int = 42`. `null` writes no default value.
   */
  public default: KtValue<TBuilder> | null;
  /**
   * Whether the parameter is written with the `vararg` modifier, such as `vararg x: Int`. The modifier is written for a
   * plain parameter as well as for a class property.
   * @default false
   */
  public vararg: boolean;
  /**
   * The description of the parameter. It is not written inline. It becomes a `@param` tag in the KDoc comment of the
   * function or class whose parameter list contains the parameter.
   */
  public description: BasicAppendValue<TBuilder> | null;

  // class parameter options
  /**
   * The visibility written before `val` or `var`, such as `private var x: Int`. Only written when `property` is set.
   */
  public accessModifier: KtAccessModifier | null;
  /**
   * Whether the parameter declares a property: `readonly` writes `val` and `mutable` writes `var`. `null` writes a
   * plain parameter without either keyword.
   */
  public property: 'readonly' | 'mutable' | null;
  /**
   * The description of the property. It is not written inline. It becomes a `@property` tag in the KDoc comment of the
   * class that declares the parameter, when `property` is set.
   */
  public propertyDescription: BasicAppendValue<TBuilder> | null;
  /**
   * Whether the property is written with the `override` modifier, such as `override var x: Int`. Only written when
   * `property` is set.
   * @default false
   */
  public override: boolean;

  /**
   * Initializes a new instance of the KtParameter class.
   * @param options The options to use for this instance.
   */
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
): KtParameter<TBuilder> => new KtParameter<TBuilder>({ ...options, name, type });

const createClassParameter = <TBuilder extends SourceBuilder>(
  name: KtParameter<TBuilder>['name'],
  type: KtParameter<TBuilder>['type'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'type'>>,
): KtParameter<TBuilder> => new KtParameter<TBuilder>({ ...options, name, type });

/**
 * Factory for creating parameter nodes. The `class` function creates a class constructor parameter, which can declare a
 * property, and accepts the options for it. The `write` function writes a parenthesized parameter list.
 *
 * @param name The name of the parameter.
 * @param type The type of the parameter.
 * @param options The settings of the parameter. See `KtParameter` for the available properties.
 * @example
 * ```ts
 * ktParameter('x', 'Int', { default: '42', annotations: [ktAnnotation('Inject')] });
 * // Emits:
 * // @Inject
 * // x: Int = 42
 * ```
 */
export const ktParameter: typeof createParameter & {
  class: typeof createClassParameter;
  write: typeof writeKtParameters;
} = Object.assign(createParameter, {
  class: createClassParameter,
  write: writeKtParameters,
});
