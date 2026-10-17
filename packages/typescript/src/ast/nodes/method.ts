import {
  type AppendValue,
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import type { TsAccessModifier } from '../common.ts';
import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import { type TsDecorator, tsDecorator } from './decorator.ts';
import { type TsDoc, tsDoc } from './doc.ts';
import { type TsGenericParameter, tsGenericParameter } from './generic-parameter.ts';
import { TsObject } from './object.ts';
import { type TsParameter, tsParameter } from './parameter.ts';
import type { TsType } from './types.ts';

type Injects = 'doc' | 'decorators' | 'modifiers' | 'name' | 'generics' | 'params' | 'returnType' | 'body';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<TsDoc<TBuilder>>;
    decorators?: Nullable<Nullable<TsDecorator<TBuilder>>[]>;
    accessModifier?: Nullable<TsAccessModifier>;
    async?: Nullable<boolean>;
    static?: Nullable<boolean>;
    abstract?: Nullable<boolean>;
    override?: Nullable<boolean>;
    name: string;
    optional?: Nullable<boolean>;
    generics?: Nullable<Nullable<TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    parameters?: Nullable<Nullable<TsParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    returnType?: Nullable<TsType<TBuilder>>;
    body?: Nullable<AppendValue<TBuilder>>;
  }
>;

/**
 * Represents a method of a class, or a method signature of an object type or an object literal.
 *
 * Written in this order: doc comment, decorators, modifiers (access modifier, `static`, `abstract`, `override`,
 * `async`), name, optional marker, generics, parameters, return type, and the body. Without a body the method ends
 * with a semicolon, except inside an object literal (`tsObject`), where every method ends with a comma instead. The
 * injection points are named after the parts they wrap, such as `beforeParams` and `afterReturnType`.
 *
 * @template TBuilder The type of the source builder the method is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsMethod
 */
export class TsMethod<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The doc comment written above the method, or `null` to omit it. The descriptions of the generic parameters and of
   * the parameters are added to it as `@template` and `@param` tags.
   */
  public doc: TsDoc<TBuilder> | null;
  /**
   * The decorators written above the method, each on its own line.
   */
  public decorators: TsDecorator<TBuilder>[];
  /**
   * The access modifier written before the method, such as `public`, or `null` to omit it.
   */
  public accessModifier: TsAccessModifier | null;
  /**
   * Whether the method is written with the `static` keyword.
   * @default false
   */
  public static: boolean;
  /**
   * Whether the method is written with the `abstract` keyword.
   * @default false
   */
  public abstract: boolean;
  /**
   * Whether the method is written with the `override` keyword.
   * @default false
   */
  public override: boolean;
  /**
   * Whether the method is written with the `async` keyword, which is placed after `override`.
   * @default false
   */
  public async: boolean;
  /**
   * The method name, written verbatim after the modifiers.
   */
  public name: string;
  /**
   * Whether the name is followed by `?`, which marks the method as optional, such as `x?()`.
   * @default false
   */
  public optional: boolean;
  /**
   * The type parameters written in angle brackets after the name, such as `<T, U>`. Described parameters also add a
   * `@template` tag to the doc comment.
   */
  public generics: (TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The parameters written in parentheses, in the given order. Each parameter with a description adds a `@param` tag to
   * the doc comment.
   */
  public parameters: (TsParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The return type written after the parameters, such as `: number`, or `null` to omit it.
   */
  public returnType: TsType<TBuilder> | null;
  /**
   * The code written in braces after the signature, one statement per line. `null` writes the method without a body,
   * which ends with a semicolon outside of object literals.
   */
  public body: AppendValue<TBuilder> | null;

  /**
   * Initializes a new instance of the TsMethod class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.decorators = options.decorators?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.static = options.static ?? false;
    this.abstract = options.abstract ?? false;
    this.override = options.override ?? false;
    this.async = options.async ?? false;
    this.name = options.name;
    this.optional = options.optional ?? false;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.returnType = options.returnType ?? null;
    this.body = options.body ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    const isInObjectDeclaration = this.getParentNode(builder) instanceof TsObject;

    builder.append(this.inject.beforeDoc);
    tsDoc.write(builder, tsDoc.get(this.doc, { generics: this.generics, parameters: this.parameters }));
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeDecorators);
    tsDecorator.write(builder, this.decorators, { multiline: true });
    builder.append(this.inject.afterDecorators);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.static) builder.append('static ');
    if (this.abstract) builder.append('abstract ');
    if (this.override) builder.append('override ');
    if (this.async) builder.append('async ');
    builder.append(this.inject.afterModifiers);

    builder.append(this.inject.beforeName, this.name, this.inject.afterName);
    if (this.optional) builder.append('?');

    builder.append(this.inject.beforeGenerics);
    tsGenericParameter.write(builder, this.generics);
    builder.append(this.inject.afterGenerics);

    builder.append(this.inject.beforeParams);
    tsParameter.write(builder, this.parameters);
    builder.append(this.inject.afterParams);

    if (this.returnType) {
      builder.append(': ');
      builder.append(this.inject.beforeReturnType);
      writeTsNode(builder, this.returnType);
      builder.append(this.inject.afterReturnType);
    }

    if (this.body) {
      builder.append(' ');
      builder.append(this.inject.beforeBody);
      builder.parenthesize('{}', this.body, { multiline: !!this.body });
      builder.append(this.inject.afterBody);
    } else if (!isInObjectDeclaration) {
      builder.append(';');
    }

    if (isInObjectDeclaration) {
      builder.append(',');
    }

    builder.appendLine();
  }
}

/**
 * Creates a method node. This is the function that `tsMethod` wraps, and `tsMethod` also provides `write`.
 *
 * @param name The name of the method. See `TsMethod.name`.
 * @param options The settings of the method. See `TsMethod` for the available properties.
 * @example
 * ```ts
 * createMethod('x', { returnType: 'number' });
 * // Emits:
 * // x(): number;
 * ```
 */
export const createMethod = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): TsMethod<TBuilder> => new TsMethod<TBuilder>({ ...options, name });

/**
 * Factory for creating method nodes. The `write` function writes one or more method nodes to a builder.
 *
 * @param name The name of the method. See `TsMethod.name`.
 * @param options The settings of the method. See `TsMethod` for the available properties.
 * @example
 * ```ts
 * tsMethod('x', { parameters: [tsParameter('y'), tsParameter('z')], returnType: 'number', body: 'return 42;' });
 * // Emits:
 * // x(y, z): number {
 * //   return 42;
 * // }
 * ```
 */
export const tsMethod: typeof createMethod & { write: typeof writeTsNodes } = Object.assign(createMethod, {
  write: writeTsNodes,
});
