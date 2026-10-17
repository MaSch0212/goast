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

/** A type declaration: `type Name Type`. */
export class GoTypeDeclaration<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public type: GoType<TBuilder>;
  public doc: GoDoc<TBuilder> | null;
  public typeParameters: GoParameter<TBuilder>[];
  public alias: boolean;

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

export const goTypeDeclaration: typeof createTypeDeclaration & { write: typeof writeGoNodes } = Object.assign(
  createTypeDeclaration,
  { write: writeGoNodes },
);
