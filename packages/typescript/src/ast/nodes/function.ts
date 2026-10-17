import {
  type AppendValue,
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import { type TsDecorator, tsDecorator } from './decorator.ts';
import { type TsDoc, tsDoc } from './doc.ts';
import { type TsGenericParameter, tsGenericParameter } from './generic-parameter.ts';
import { type TsParameter, tsParameter } from './parameter.ts';
import type { TsType } from './types.ts';

type Injects = 'doc' | 'decorators' | 'modifiers' | 'name' | 'generics' | 'params' | 'returnType' | 'body';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<TsDoc<TBuilder>>;
    decorators?: Nullable<Nullable<TsDecorator<TBuilder>>[]>;
    export?: boolean;
    name: string;
    generics?: Nullable<Nullable<TsGenericParameter<TBuilder>>[]>;
    parameters?: Nullable<Nullable<TsParameter<TBuilder>>[]>;
    returnType?: Nullable<TsType<TBuilder>>;
    body?: Nullable<AppendValue<TBuilder>>;
  }
>;

/**
 * Represents a function declaration.
 *
 * Written in this order: the doc comment, the decorators, the `export` keyword, the name, the generics, the parameters,
 * the return type, then the body in braces, followed by a line break.
 *
 * @template TBuilder The type of the source builder the function is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsFunction
 */
export class TsFunction<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The doc comment written above the function, or `null` to omit it. Descriptions of generic parameters are merged
   * into it as `@template` tags. Parameter descriptions are not written for functions, so add `@param` tags to the doc
   * instead.
   */
  public doc: TsDoc<TBuilder> | null;
  /**
   * The decorators written above the function, each on its own line.
   */
  public decorators: TsDecorator<TBuilder>[];
  /**
   * Whether the function is written with the `export` keyword.
   * @default false
   */
  public export: boolean;
  /**
   * The name of the function, written after the `function` keyword.
   */
  public name: string;
  /**
   * The type parameters written in angle brackets after the name, such as `<T, U>`. Nothing is written when empty.
   */
  public generics: TsGenericParameter<TBuilder>[];
  /**
   * The parameters written in parentheses after the name. More than two parameters are written one per line.
   */
  public parameters: TsParameter<TBuilder>[];
  /**
   * The return type written after the parameters as `: Type`, or `null` to omit it.
   */
  public returnType: TsType<TBuilder> | null;
  /**
   * The statements written in the body, on their own indented lines, or `null` to write empty braces `{}`.
   */
  public body: AppendValue<TBuilder> | null;

  /**
   * Initializes a new instance of the TsFunction class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.decorators = options.decorators?.filter(notNullish) ?? [];
    this.export = options.export ?? false;
    this.name = options.name;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.returnType = options.returnType ?? null;
    this.body = options.body ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    tsDoc.write(builder, tsDoc.get(this.doc, { generics: this.generics }));
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeDecorators);
    tsDecorator.write(builder, this.decorators, { multiline: true });
    builder.append(this.inject.afterDecorators);

    builder.append(this.inject.beforeModifiers);
    if (this.export) builder.append('export ');
    builder.append(this.inject.afterModifiers);

    builder.append('function ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

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

    builder.append(' ');

    builder.append(this.inject.beforeBody);
    builder.parenthesize('{}', this.body, { multiline: !!this.body });
    builder.append(this.inject.afterBody);

    builder.appendLine();
  }
}

const createFunction = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): TsFunction<TBuilder> => new TsFunction<TBuilder>({ ...options, name });

/**
 * Factory for creating function declaration nodes. The `write` function writes one or more functions to a builder.
 *
 * @param name The name of the function.
 * @param options The settings of the function. See `TsFunction` for the available properties.
 * @example
 * ```ts
 * tsFunction('add', {
 *   export: true,
 *   generics: [tsGenericParameter('T')],
 *   parameters: [tsParameter('a', { type: 'T' }), tsParameter('b', { type: 'T' })],
 *   returnType: 'T',
 *   body: 'return a;',
 * });
 * // Emits:
 * // export function add<T>(a: T, b: T): T {
 * //   return a;
 * // }
 * ```
 */
export const tsFunction: typeof createFunction & { write: typeof writeTsNodes } = Object.assign(createFunction, {
  write: writeTsNodes,
});
