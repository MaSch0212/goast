import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import type { TsAccessModifier } from '../common.ts';
import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import { type TsDecorator, tsDecorator } from './decorator.ts';
import { type TsDoc, tsDoc } from './doc.ts';
import { TsObject } from './object.ts';
import {
  createPropertyGetter,
  createPropertySetter,
  type TsPropertyGetter,
  type TsPropertySetter,
} from './property-accessor.ts';
import { tsString } from './string.ts';
import type { TsType, TsValue } from './types.ts';

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

/**
 * Base class for the properties of classes and object literals. It holds the parts that all properties share: the name,
 * the doc comment, the decorators, the type and the modifiers.
 *
 * Use `tsProperty` to create a property. It returns a `TsSimpleProperty` for a plain property, and a
 * `TsAccessorProperty` when getters or setters are passed in its options.
 *
 * @template TBuilder The type of the source builder the property is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsProperty
 */
export abstract class TsProperty<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | BaseInjects
> {
  /**
   * The name of the property. A simple property writes it verbatim, or in quotes when it is not a plain identifier,
   * such as `'x y'`. An accessor property writes it through its getter and setter instead.
   */
  public name: string;
  /**
   * The doc comment written above the property, or `null` to omit it. It is written as given, so no tags are added.
   */
  public doc: TsDoc<TBuilder> | null;
  /**
   * The decorators written before the property. They are separated by spaces and written on the same line as the
   * property, such as `@decorator x;`.
   */
  public decorators: TsDecorator<TBuilder>[];
  /**
   * The type annotation written after the name, such as `: number`, or `null` to omit it. A simple property also omits
   * the annotation inside an object literal, which has none.
   */
  public type: TsType<TBuilder> | null;
  /**
   * The access modifier written before the property, such as `public`, or `null` to omit it.
   */
  public accessModifier: TsAccessModifier | null;
  /**
   * Whether the property is written with the `static` keyword. `null` and `false` both omit the keyword.
   * @default null
   */
  public static: boolean | null;
  /**
   * Whether the property is written with the `abstract` keyword. `null` and `false` both omit the keyword.
   * @default null
   */
  public abstract: boolean | null;
  /**
   * Whether the property is written with the `override` keyword. `null` and `false` both omit the keyword.
   * @default null
   */
  public override: boolean | null;

  /**
   * Initializes a new instance of the TsProperty class.
   * @param options The options to use for this instance.
   */
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

/**
 * Represents a property with a name, an optional type and an optional value, such as `readonly x?: number = 42;`.
 *
 * Written in this order: doc comment, decorators, modifiers (access modifier, `static`, `abstract`, `override`,
 * `readonly`), name, optional marker, type annotation, value, and a terminator. Inside an object literal (`tsObject`),
 * the property is written as `x: 42,` instead: the type annotation is omitted, the value follows a colon, and a comma
 * ends the property.
 *
 * @template TBuilder The type of the source builder the property is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsProperty
 */
export class TsSimpleProperty<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsProperty<
  TBuilder,
  TInjects
> {
  /**
   * The initial value of the property, or `null` to omit it. In a class it is written after ` = `, such as `x = 42;`,
   * and in an object literal after a colon, such as `x: 42,`. Falsy values are not written.
   */
  public value: TsValue<TBuilder> | null;
  /**
   * Whether the property is written with the `readonly` keyword, which is placed after the other modifiers.
   * @default false
   */
  public readonly: boolean;
  /**
   * Whether the name is followed by `?`, which marks the property as optional, such as `x?: number`.
   * @default false
   */
  public optional: boolean;

  /**
   * Initializes a new instance of the TsSimpleProperty class.
   * @param options The options to use for this instance.
   */
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

    writeTsNode(builder, /^([a-zA-Z_$][a-zA-Z_$0-9]*|[0-9]+)$/.test(this.name) ? this.name : tsString(this.name));
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

/**
 * Represents a property that is written as a getter, a setter, or both, such as `get x(): number` and `set x(value)`.
 *
 * The property writes its doc comment and decorators first, then its getter, and then its setter. The accessors take
 * their name, type and modifiers from this property when those are set here.
 *
 * @template TBuilder The type of the source builder the property is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsProperty
 * @see TsPropertyGetter
 * @see TsPropertySetter
 */
export class TsAccessorProperty<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsProperty<
  TBuilder,
  TInjects
> {
  private _get: TsPropertyGetter<TBuilder> | null = null;
  private _set: TsPropertySetter<TBuilder> | null = null;

  /**
   * The getter of the property, or `null` to omit it. Assigning a getter links it to this property, so the getter takes
   * its name, type and modifiers from here. A getter that was assigned before is unlinked.
   */
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

  /**
   * The setter of the property, or `null` to omit it. Assigning a setter links it to this property, so the setter takes
   * its name, type and modifiers from here. A setter that was assigned before is unlinked.
   */
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

  /**
   * Initializes a new instance of the TsAccessorProperty class.
   * @param options The options to use for this instance.
   */
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
): TsProperty<TBuilder> => {
  if (options && ('get' in options || 'set' in options)) {
    return new TsAccessorProperty({ ...options, name });
  }
  return new TsSimpleProperty({ ...options, name });
};

/**
 * Factory for creating property nodes. The `write` function writes one or more property nodes to a builder. The
 * `getter` and `setter` functions create the accessors that are passed to an accessor property.
 *
 * Passing `get` or `set` in the options creates a `TsAccessorProperty`. Otherwise a `TsSimpleProperty` is created.
 *
 * @param name The name of the property. See `TsProperty.name`.
 * @param options The settings of the property. See `TsSimpleProperty` and `TsAccessorProperty` for the available
 * properties.
 * @example
 * ```ts
 * tsProperty('x', { type: 'number', value: 42, readonly: true, accessModifier: 'public' });
 * // Emits:
 * // public readonly x: number = 42;
 * ```
 */
export const tsProperty: typeof createProperty & {
  write: typeof writeTsNodes;
  getter: typeof createPropertyGetter;
  setter: typeof createPropertySetter;
} = Object.assign(createProperty, {
  write: writeTsNodes,
  getter: createPropertyGetter,
  setter: createPropertySetter,
});
