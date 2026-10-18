import {
  type AppendValue,
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import type { KtAccessModifier } from '../common.ts';
import { KtNode } from '../node.ts';
import { writeKtNode, writeKtNodes } from '../utils/write-kt-node.ts';
import { type KtAnnotation, ktAnnotation } from './annotation.ts';
import { type KtDoc, ktDoc } from './doc.ts';
import { type KtGenericParameter, ktGenericParameter } from './generic-parameter.ts';
import { KtInterface } from './interface.ts';
import { type KtParameter, ktParameter } from './parameter.ts';
import type { KtType } from './types.ts';

type Injects =
  | 'doc'
  | 'annotations'
  | 'modifiers'
  | 'generics'
  | 'receiverAnnotations'
  | 'receiverType'
  | 'name'
  | 'parameters'
  | 'returnType';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    generics?: Nullable<Nullable<KtGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    parameters?: Nullable<Nullable<KtParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    doc?: Nullable<KtDoc<TBuilder>>;
    returnType?: Nullable<KtType<TBuilder>>;
    body?: Nullable<AppendValue<TBuilder>>;
    accessModifier?: Nullable<KtAccessModifier>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    receiverType?: Nullable<KtType<TBuilder>>;
    receiverAnnotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    singleExpression?: Nullable<boolean>;
    open?: Nullable<boolean>;
    inline?: Nullable<boolean>;
    infix?: Nullable<boolean>;
    tailrec?: Nullable<boolean>;
    suspend?: Nullable<boolean>;
    operator?: Nullable<boolean>;
    override?: Nullable<boolean>;
    abstract?: Nullable<boolean>;
  }
>;

/**
 * Represents a Kotlin function declaration, such as `fun String.greet(name: String): String = "Hello, $name"`.
 *
 * Written in this order: the doc comment, annotations, the modifiers, `fun`, the generics, the receiver type followed
 * by a dot, the name, the parameters, the return type, then the body. The modifiers are written in the order access
 * modifier, `inline`, `infix`, `tailrec`, `suspend`, `open`, `override`, `abstract`, `operator`. A body is omitted for
 * abstract functions and for functions in an interface that have no body.
 *
 * @template TBuilder The type of the source builder the function is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktFunction
 */
export class KtFunction<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the function, written verbatim after the receiver type, if there is one.
   */
  public name: string;
  /**
   * The type parameters written in angle brackets after `fun`, such as `<T>`. Plain strings are written as-is, while
   * described parameters also add a `@param` tag to the doc comment.
   */
  public generics: (KtGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The parameters written in parentheses after the name. Parameters with a description add a `@param` tag to the doc
   * comment.
   */
  public parameters: (KtParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The KDoc comment written above the function, or `null` to omit it. Descriptions of generic parameters and function
   * parameters are merged into it as `@param` tags.
   */
  public doc: KtDoc<TBuilder> | null;
  /**
   * The return type written after `:`, or `null` to omit it.
   */
  public returnType: KtType<TBuilder> | null;
  /**
   * The statements written inside the braces, or the expression written after `=` when `singleExpression` is set.
   * `null` writes empty braces. Nothing is written for abstract functions and for interface functions without a body.
   */
  public body: AppendValue<TBuilder> | null;
  /**
   * The visibility modifier written before `fun`, or `null` to omit it.
   */
  public accessModifier: KtAccessModifier | null;
  /**
   * The annotations written above the function, each on its own line.
   */
  public annotations: KtAnnotation<TBuilder>[];
  /**
   * The receiver type written before the name, followed by a dot, such as `String` for `String.greet`. `null` omits it.
   */
  public receiverType: KtType<TBuilder> | null;
  /**
   * The annotations written on the same line directly before the receiver type, such as `@Fancy` in
   * `fun @Fancy String.foo()`. Only written when `receiverType` is set.
   */
  public receiverAnnotations: KtAnnotation<TBuilder>[];
  /**
   * Whether the body is written as a single expression after `=` instead of a block in braces. Only applies when a body
   * is set.
   * @default false
   */
  public singleExpression: boolean;
  /**
   * Whether the function is written with the `open` modifier, which allows subclasses to override it.
   * @default false
   */
  public open: boolean;
  /**
   * Whether the function is written with the `inline` modifier.
   * @default false
   */
  public inline: boolean;
  /**
   * Whether the function is written with the `infix` modifier, which allows calls in infix form.
   * @default false
   */
  public infix: boolean;
  /**
   * Whether the function is written with the `tailrec` modifier, which turns recursive calls into loops.
   * @default false
   */
  public tailrec: boolean;
  /**
   * Whether the function is written with the `suspend` modifier, which makes it a coroutine function.
   * @default false
   */
  public suspend: boolean;
  /**
   * Whether the function is written with the `operator` modifier, which allows calls through operator conventions.
   * @default false
   */
  public operator: boolean;
  /**
   * Whether the function is written with the `override` modifier, which overrides a member of a supertype.
   * @default false
   */
  public override: boolean;
  /**
   * Whether the function is written with the `abstract` modifier. Abstract functions are written without a body.
   * @default false
   */
  public abstract: boolean;

  /**
   * Initializes a new instance of the KtFunction class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.doc = options.doc ?? null;
    this.returnType = options.returnType ?? null;
    this.body = options.body ?? null;
    this.accessModifier = options.accessModifier ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.receiverType = options.receiverType ?? null;
    this.receiverAnnotations = options.receiverAnnotations?.filter(notNullish) ?? [];
    this.singleExpression = options.singleExpression ?? false;
    this.open = options.open ?? false;
    this.inline = options.inline ?? false;
    this.infix = options.infix ?? false;
    this.tailrec = options.tailrec ?? false;
    this.suspend = options.suspend ?? false;
    this.operator = options.operator ?? false;
    this.override = options.override ?? false;
    this.abstract = options.abstract ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    ktDoc.get(this.doc, { generics: this.generics, parameters: this.parameters })?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations, { multiline: true });
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.inline) builder.append('inline ');
    if (this.infix) builder.append('infix ');
    if (this.tailrec) builder.append('tailrec ');
    if (this.suspend) builder.append('suspend ');
    if (this.open) builder.append('open ');
    if (this.override) builder.append('override ');
    if (this.abstract) builder.append('abstract ');
    if (this.operator) builder.append('operator ');
    builder.append(this.inject.afterModifiers);

    builder.append('fun ');

    builder.append(this.inject.beforeGenerics);
    ktGenericParameter.write(builder, this.generics);
    builder.append(this.inject.afterGenerics);
    if (this.generics.length > 0) builder.append(' ');

    if (this.receiverType) {
      builder.append(this.inject.beforeReceiverAnnotations);
      ktAnnotation.write(builder, this.receiverAnnotations, { multiline: false });
      builder.append(this.inject.afterReceiverAnnotations);

      builder.append(this.inject.beforeReceiverType);
      writeKtNode(builder, this.receiverType);
      builder.append(this.inject.afterReceiverType);
      builder.append('.');
    }

    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    builder.append(this.inject.beforeParameters);
    ktParameter.write(builder, this.parameters);
    builder.append(this.inject.afterParameters);

    if (this.returnType) {
      builder.append(': ');
      builder.append(this.inject.beforeReturnType);
      writeKtNode(builder, this.returnType);
      builder.append(this.inject.afterReturnType);
    }

    const isInInterface = this.getParentNode(builder) instanceof KtInterface;
    if (!this.abstract && (this.body || !isInInterface)) {
      builder.append(' ');
      if (this.singleExpression && this.body) {
        builder.append('= ');
        builder.indent(this.body);
      } else {
        builder.parenthesize('{}', this.body, { multiline: !!this.body });
      }
    }

    builder.appendLine();
  }
}

const createFunction = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): KtFunction<TBuilder> => new KtFunction<TBuilder>({ ...options, name });

/**
 * Factory for creating function nodes. The `write` function writes one or more function nodes to a builder.
 *
 * @param name The name of the function.
 * @param options The settings of the function. See `KtFunction` for the available properties.
 * @example
 * ```ts
 * ktFunction('greet', {
 *   parameters: [ktParameter('name', 'String')],
 *   returnType: 'String',
 *   body: '"Hello, $name"',
 *   singleExpression: true,
 * });
 * // Emits:
 * // fun greet(name: String): String = "Hello, $name"
 * ```
 */
export const ktFunction: typeof createFunction & { write: typeof writeKtNodes } = Object.assign(createFunction, {
  write: writeKtNodes,
});
