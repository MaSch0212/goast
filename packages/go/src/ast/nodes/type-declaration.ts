import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { GoNode } from '../node.ts';
import { writeGoNode, writeGoNodes } from '../utils/write-go-node.ts';
import type { GoDoc } from './doc.ts';
import type { GoParameter } from './parameter.ts';
import type { GoType } from './types.ts';

type Injects = 'doc' | 'name' | 'typeParameters' | 'type';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    type: GoType<TBuilder>;
    doc?: Nullable<GoDoc<TBuilder>>;
    /** Type parameters, each a parameter whose type is the constraint (e.g. `T any`). */
    typeParameters?: Nullable<Nullable<GoParameter<TBuilder>>[]>;
    /** Whether to declare an alias (`type A = B`) instead of a new type (`type A B`). */
    alias?: Nullable<boolean>;
  }
>;

/**
 * A type declaration, written as `type Name Type`. The doc comment is written above the declaration. Type parameters
 * follow the name in square brackets, as in `type Set[T any] map[T]bool`. With `alias`, an equals sign is written
 * before the type, as in `type Anything = any`. The declaration ends with a line break.
 *
 * @template TBuilder The type of the source builder the declaration is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see goTypeDeclaration
 */
export class GoTypeDeclaration<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the declared type.
   */
  public name: string;
  /**
   * The type the name is declared as, written after the name, or after the equals sign of an alias.
   */
  public type: GoType<TBuilder>;
  /**
   * The doc comment written above the declaration, or `null` to omit it.
   */
  public doc: GoDoc<TBuilder> | null;
  /**
   * The type parameters written in square brackets after the name, in order. An empty list writes nothing.
   */
  public typeParameters: GoParameter<TBuilder>[];
  /**
   * Whether to declare an alias, which writes `=` before the type, instead of a new type.
   * @default false
   */
  public alias: boolean;

  /**
   * Initializes a new instance of the GoTypeDeclaration class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.type = options.type;
    this.doc = options.doc ?? null;
    this.typeParameters = options.typeParameters?.filter(notNullish) ?? [];
    this.alias = options.alias ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    this.doc?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append('type ', this.inject.beforeName, this.name, this.inject.afterName);
    if (this.typeParameters.length > 0) {
      builder.append(this.inject.beforeTypeParameters);
      builder.parenthesize('[]', (b) => writeGoNodes(b, this.typeParameters, { separator: ', ' }));
      builder.append(this.inject.afterTypeParameters);
    }
    builder.append(this.alias ? ' = ' : ' ');
    builder.append(this.inject.beforeType);
    writeGoNode(builder, this.type);
    builder.append(this.inject.afterType);
    builder.appendLine();
  }
}

const createTypeDeclaration = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  type: Options<TBuilder>['type'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'type'>>,
): GoTypeDeclaration<TBuilder> => new GoTypeDeclaration<TBuilder>({ ...options, name, type });

/**
 * Factory for creating type declaration nodes. The `write` function writes one or more type declaration nodes to a
 * builder.
 *
 * @param name The name of the declared type.
 * @param type The type the name is declared as.
 * @param options The settings of the declaration. See `GoTypeDeclaration` for the available properties.
 * @example
 * ```ts
 * goTypeDeclaration('Tags', goMap(refs.string(), refs.string()), { doc: goDoc('Tags.') });
 * // Emits:
 * // // Tags.
 * // type Tags map[string]string
 * ```
 */
export const goTypeDeclaration: typeof createTypeDeclaration & { write: typeof writeGoNodes } = Object.assign(
  createTypeDeclaration,
  { write: writeGoNodes },
);
