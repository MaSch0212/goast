import {
  type AppendValue,
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import type { KtAccessModifier } from '../common.ts';
import { KtNode } from '../node.ts';
import { writeKtNode, writeKtNodes } from '../utils/write-kt-node.ts';
import { type KtAnnotation, ktAnnotation } from './annotation.ts';
import { type KtArgument, ktArgument } from './argument.ts';
import type { KtDoc } from './doc.ts';
import type { KtType, KtValue } from './types.ts';

type AccessorInjects = 'annotations' | 'modifiers' | 'params' | 'body';

type AccessorOptions<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | AccessorInjects>,
  {
    accessModifier?: Nullable<KtAccessModifier>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    body?: Nullable<AppendValue<TBuilder>>;
    singleExpression?: Nullable<boolean>;
  }
>;

/**
 * Base class for the getter and setter of a Kotlin property, such as `get() = 42` or `private set`.
 *
 * Written in this order: the annotations, each on a line of its own, the access modifier, then the `get` or `set`
 * keyword. A body follows the keyword: `()` for a getter or `(value)` for a setter, then either ` = ` and the
 * expression, or a braced block on indented lines. Without a body, only the modifier and the keyword are written.
 *
 * @template TBuilder The type of the source builder the accessor is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktProperty.getter
 * @see ktProperty.setter
 */
export abstract class KtPropertyAccessor<
  TBuilder extends SourceBuilder,
  TInjects extends string = never,
> extends KtNode<TBuilder, TInjects | AccessorInjects> {
  /**
   * The keyword written for the accessor, `get` or `set`. It also decides the parameter list of the body: `()` for a
   * getter and `(value)` for a setter.
   */
  public abstract get kind(): 'get' | 'set';
  /**
   * The visibility written before the keyword, such as `private` in `private set`. `null` writes no visibility keyword,
   * so the accessor has the visibility of the property.
   */
  public accessModifier: KtAccessModifier | null;
  /**
   * The annotations written above the accessor, each on a line of its own.
   */
  public annotations: KtAnnotation<TBuilder>[];
  /**
   * The code of the accessor, written after the parameter list. `null` writes no body. With `singleExpression` the code
   * follows ` = `, otherwise it is written in braces on indented lines.
   */
  public body: AppendValue<TBuilder> | null;
  /**
   * Whether the body is a single expression written after ` = ` on the same line, such as `get() = 42`. Otherwise the
   * body is written in braces. Has no effect without a body.
   * @default false
   */
  public singleExpression: boolean;

  /**
   * Initializes a new instance of the KtPropertyAccessor class.
   * @param options The options to use for this instance.
   */
  constructor(options: AccessorOptions<TBuilder, TInjects>) {
    super(options);
    this.accessModifier = options.accessModifier ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.body = options.body ?? null;
    this.singleExpression = options.singleExpression ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations, { multiline: true });
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    builder.append(this.inject.afterModifiers);

    builder.append(this.kind);

    if (this.body) {
      builder.append(this.inject.beforeParams);
      builder.append(this.kind === 'set' ? '(value)' : '()');
      builder.append(this.inject.afterParams);

      if (this.singleExpression) {
        builder.append(' = ', this.inject.beforeBody);
        builder.indent(this.body);
      } else {
        builder.append(' ', this.inject.beforeBody);
        builder.parenthesize('{}', this.body, { multiline: true });
      }
      builder.append(this.inject.afterBody);
    }

    builder.appendLine();
  }
}
/**
 * Represents the getter of a Kotlin property, written with the `get` keyword. See `KtPropertyAccessor` for the order in
 * which it is written.
 *
 * @template TBuilder The type of the source builder the getter is written to.
 * @see ktProperty.getter
 */
export class KtPropertyGetter<TBuilder extends SourceBuilder> extends KtPropertyAccessor<TBuilder> {
  /**
   * The keyword of the accessor, always `get`. A body is written with an empty parameter list, such as `get() = 42`.
   */
  public override readonly kind = 'get' as const;
}
/**
 * Represents the setter of a Kotlin property, written with the `set` keyword. See `KtPropertyAccessor` for the order in
 * which it is written.
 *
 * @template TBuilder The type of the source builder the setter is written to.
 * @see ktProperty.setter
 */
export class KtPropertySetter<TBuilder extends SourceBuilder> extends KtPropertyAccessor<TBuilder> {
  /**
   * The keyword of the accessor, always `set`. A body uses the parameter list `(value)`, as in `set(value) = 42`.
   */
  public override readonly kind = 'set' as const;
}

type Injects = 'doc' | 'annotations' | 'modifiers' | 'name' | 'type' | 'default' | 'delegate';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<KtDoc<TBuilder>>;
    name: string;
    type?: KtType<TBuilder>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    accessModifier?: Nullable<KtAccessModifier>;
    getter?: Nullable<KtPropertyGetter<TBuilder>>;
    setter?: Nullable<KtPropertySetter<TBuilder>>;
    default?: Nullable<KtValue<TBuilder>>;
    delegate?: Nullable<KtType<TBuilder>>;
    delegateArguments?: Nullable<Nullable<KtArgument<TBuilder> | KtValue<TBuilder>>[]>;
    mutable?: Nullable<boolean>;
    const?: Nullable<boolean>;
    lateinit?: Nullable<boolean>;
    open?: Nullable<boolean>;
    override?: Nullable<boolean>;
    abstract?: Nullable<boolean>;
  }
>;

/**
 * Represents a Kotlin property declaration, such as `val x: Int = 42` or `var x: Int` with a private setter.
 *
 * Written in this order: the KDoc comment, the annotations, the modifiers, `val` or `var`, the name, the type, the
 * default value or the delegate, then the getter and the setter, indented on lines below. The modifiers are written in
 * the order access modifier, `const`, `lateinit`, `abstract`, `override`, `open`. A property with a setter is always
 * written with `var`. Without a type, `: Any?` is written unless a default value or a getter body is present, in which
 * case no type is written.
 *
 * @template TBuilder The type of the source builder the property is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktProperty
 */
export class KtProperty<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The KDoc comment written above the property, or `null` to omit it. Nothing is written when the comment has neither
   * a description nor tags.
   */
  public doc: KtDoc<TBuilder> | null;
  /**
   * The name of the property, written after `val` or `var`.
   */
  public name: string;
  /**
   * The type written after the colon, such as `Int` in `val x: Int`. When it is `null`, `: Any?` is written if there is
   * neither a default value nor a getter body, and no type is written otherwise.
   */
  public type: KtType<TBuilder> | null;
  /**
   * The annotations written above the property, each on a line of its own. The target of an annotation is written as a
   * use-site target, such as `@field:Json` or `@get:Inject`.
   */
  public annotations: KtAnnotation<TBuilder>[];
  /**
   * The visibility written before the other modifiers, such as `private` in `private val x`. `null` writes no
   * visibility keyword.
   */
  public accessModifier: KtAccessModifier | null;
  /**
   * The getter written on an indented line below the property, such as `get() = 42`. `null` writes no getter.
   */
  public getter: KtPropertyGetter<TBuilder> | null;
  /**
   * The setter written on an indented line below the property, such as `private set`. Its presence makes the property
   * `var`. `null` writes no setter.
   */
  public setter: KtPropertySetter<TBuilder> | null;
  /**
   * The initial value written after ` = `, such as `42` in `val x = 42`. `null` writes no initial value.
   */
  public default: KtValue<TBuilder> | null;
  /**
   * The delegate written after ` by `, such as `lazy` in `val x: Int by lazy`. `null` writes no delegation.
   */
  public delegate: KtType<TBuilder> | null;
  /**
   * The arguments written in parentheses after the delegate, such as `(42, true)` in `by lazy(42, true)`. Only written
   * when `delegate` is set. An empty list writes `()`.
   */
  public delegateArguments: (KtArgument<TBuilder> | KtValue<TBuilder>)[] | null;
  /**
   * Whether the property is written with `var` instead of `val`. A property with a setter is always `var`.
   * @default false
   */
  public mutable: boolean;
  /**
   * Whether the property is written with the `const` modifier, such as `const val x`.
   * @default false
   */
  public const: boolean;
  /**
   * Whether the property is written with the `lateinit` modifier, such as `lateinit var x`.
   * @default false
   */
  public lateinit: boolean;
  /**
   * Whether the property is written with the `open` modifier, such as `open val x`.
   * @default false
   */
  public open: boolean;
  /**
   * Whether the property is written with the `override` modifier, such as `override val x`.
   * @default false
   */
  public override: boolean;
  /**
   * Whether the property is written with the `abstract` modifier, such as `abstract val x: Int`.
   * @default false
   */
  public abstract: boolean;

  /**
   * Initializes a new instance of the KtProperty class.
   * @param options The options to use for this instance.
   */
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
    builder.append(this.inject.beforeDoc);
    this.doc?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations, { multiline: true });
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.const) builder.append('const ');
    if (this.lateinit) builder.append('lateinit ');
    if (this.abstract) builder.append('abstract ');
    if (this.override) builder.append('override ');
    if (this.open) builder.append('open ');
    builder.append(this.inject.afterModifiers);

    builder.append(this.mutable || !!this.setter ? 'var ' : 'val ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    if (this.type || (!this.default && !this.getter?.body)) {
      builder.append(': ', this.inject.beforeType);
      writeKtNode(builder, this.type ?? 'Any?');
      builder.append(this.inject.afterType);
    }

    if (this.default) {
      builder.append(' = ', this.inject.beforeDefault);
      writeKtNode(builder, this.default);
      builder.append(this.inject.afterDefault);
    }

    if (this.delegate) {
      builder.append(' by ', this.inject.beforeDelegate);
      writeKtNode(builder, this.delegate);
      if (this.delegateArguments) {
        ktArgument.write(builder, this.delegateArguments);
      }
      builder.append(this.inject.afterDelegate);
    }

    builder.appendLine();

    if (this.getter || this.setter) {
      builder.indent((b) => {
        this.getter?.write(b);
        this.setter?.write(b);
      });
    }

    builder.ensureCurrentLineEmpty();
  }
}

const createPropertyGetter = <TBuilder extends SourceBuilder>(
  options?: AccessorOptions<TBuilder>,
): KtPropertyGetter<TBuilder> => new KtPropertyGetter<TBuilder>(options ?? {});

const createPropertySetter = <TBuilder extends SourceBuilder>(
  options?: AccessorOptions<TBuilder>,
): KtPropertySetter<TBuilder> => new KtPropertySetter<TBuilder>(options ?? {});

const createProperty = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): KtProperty<TBuilder> => new KtProperty<TBuilder>({ ...options, name });

/**
 * Factory for creating property nodes. The `getter` and `setter` functions create the accessors of a property and
 * accept the options of `KtPropertyAccessor`. The `write` function writes one or more property nodes to a builder.
 *
 * @param name The name of the property.
 * @param options The settings of the property. See `KtProperty` for the available properties.
 * @example
 * ```ts
 * ktProperty('count', {
 *   type: 'Int',
 *   mutable: true,
 *   default: '0',
 *   setter: ktProperty.setter({ accessModifier: 'private' }),
 * });
 * // Emits:
 * // var count: Int = 0
 * //     private set
 * ```
 */
export const ktProperty: typeof createProperty & {
  getter: typeof createPropertyGetter;
  setter: typeof createPropertySetter;
  write: typeof writeKtNodes;
} = Object.assign(createProperty, {
  getter: createPropertyGetter,
  setter: createPropertySetter,
  write: writeKtNodes,
});
