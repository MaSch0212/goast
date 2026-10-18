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

  /**
   * The doc comment written above the accessor, or `null` to omit it. It is written as given, after the doc comment of
   * the owning property when there is one.
   */
  public doc: TsDoc<TBuilder> | null;
  /**
   * The decorators written before the accessor. They are separated by spaces and written on the same line as the
   * accessor, such as `@decorator get x();`.
   */
  public decorators: TsDecorator<TBuilder>[];
  /**
   * The code written in braces after the signature, on separate lines. `null` writes the accessor without a body,
   * which ends with a semicolon instead.
   */
  public body: AppendValue<TBuilder> | null;

  /**
   * The name written after `get` or `set`. When the accessor belongs to an accessor property, the name of that property
   * is used instead. Defaults to `someProperty` when neither is set.
   */
  public get propertyName(): string {
    return this.property?.name ?? this._propertyName ?? 'someProperty';
  }
  public set propertyName(value: string | null) {
    this._propertyName = value;
  }

  /**
   * The type of the accessor. A getter writes it as its return type, such as `: number`, and a setter writes it as the
   * type of its `value` parameter. When the accessor belongs to an accessor property, the type of that property is used
   * if it is set. `null` omits the type.
   */
  public get type(): TsType<TBuilder> | null {
    return this.property?.type ?? this._type;
  }
  public set type(value: TsType<TBuilder> | null) {
    this._type = value;
  }

  /**
   * The access modifier written before the accessor, such as `public`, or `null` to omit it. When the accessor belongs
   * to an accessor property, the modifier of that property is used if it is set.
   */
  public get accessModifier(): TsAccessModifier | null {
    return this.property?.accessModifier ?? this._accessModifier;
  }
  public set accessModifier(value: TsAccessModifier | null) {
    this._accessModifier = value;
  }

  /**
   * Whether the accessor is written with the `static` keyword. When the accessor belongs to an accessor property, the
   * value of that property is used if it is set.
   * @default false
   */
  public get static(): boolean {
    return this.property?.static ?? this._static;
  }
  public set static(value: boolean) {
    this._static = value;
  }

  /**
   * Whether the accessor is written with the `abstract` keyword. When the accessor belongs to an accessor property, the
   * value of that property is used if it is set.
   * @default false
   */
  public get abstract(): boolean {
    return this.property?.abstract ?? this._abstract;
  }
  public set abstract(value: boolean) {
    this._abstract = value;
  }

  /**
   * Whether the accessor is written with the `override` keyword. When the accessor belongs to an accessor property, the
   * value of that property is used if it is set.
   * @default false
   */
  public get override(): boolean {
    return this.property?.override ?? this._override;
  }
  public set override(value: boolean) {
    this._override = value;
  }

  protected property?: TsProperty<TBuilder>;

  /**
   * Initializes a new instance of the TsPropertyAccessor class.
   * @param options The options to use for this instance.
   */
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

/**
 * Represents the setter of a property, such as `set x(value: number) { ... }`.
 *
 * Written in this order: doc comment, decorators, modifiers (access modifier, `static`, `abstract`, `override`), the
 * `set` keyword, the name, and a `value` parameter, which is typed when a type is set. Without a body the setter ends
 * with a semicolon. A body is written in braces over several lines.
 *
 * @template TBuilder The type of the source builder the setter is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see createPropertySetter
 */
export class TsPropertySetter<
  TBuilder extends SourceBuilder,
  TInjects extends string = never,
> extends TsPropertyAccessor<TBuilder, TInjects> {
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

/**
 * Represents the getter of a property, such as `get x(): number { ... }`.
 *
 * Written in this order: doc comment, decorators, modifiers (access modifier, `static`, `abstract`, `override`), the
 * `get` keyword, the name, an empty parameter list, and the return type when a type is set. Without a body the getter
 * ends with a semicolon. A body is written in braces over several lines.
 *
 * @template TBuilder The type of the source builder the getter is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see createPropertyGetter
 */
export class TsPropertyGetter<
  TBuilder extends SourceBuilder,
  TInjects extends string = never,
> extends TsPropertyAccessor<TBuilder, TInjects> {
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

/**
 * Factory for creating property setter nodes. The returned node is written with its `write` method, or it is passed
 * to the `set` of an accessor property (see `tsProperty`).
 *
 * @param options The settings of the setter. See `TsPropertySetter` for the available properties.
 * @example
 * ```ts
 * createPropertySetter({ propertyName: 'x', type: 'number', body: 'this.x = value;' });
 * // Emits:
 * // set x(value: number) {
 * //   this.x = value;
 * // }
 * ```
 */
export const createPropertySetter = <TBuilder extends SourceBuilder>(
  options?: Options<TBuilder>,
): TsPropertySetter<TBuilder> => new TsPropertySetter<TBuilder>(options ?? {});

/**
 * Factory for creating property getter nodes. The returned node is written with its `write` method, or it is passed
 * to the `get` of an accessor property (see `tsProperty`).
 *
 * @param options The settings of the getter. See `TsPropertyGetter` for the available properties.
 * @example
 * ```ts
 * createPropertyGetter({ propertyName: 'x', type: 'number', body: 'return this.x;' });
 * // Emits:
 * // get x(): number {
 * //   return this.x;
 * // }
 * ```
 */
export const createPropertyGetter = <TBuilder extends SourceBuilder>(
  options?: Options<TBuilder>,
): TsPropertyGetter<TBuilder> => new TsPropertyGetter<TBuilder>(options ?? {});
