import {
  type AstNodeOptions,
  type BasicAppendValue,
  createOverwriteProxy,
  getIsInstanceOf,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { KtNode } from '../node.ts';
import { writeKtNodes } from '../utils/write-kt-node.ts';
import { type KtDocTag, ktDocTag } from './doc-tag.ts';
import { KtGenericParameter } from './generic-parameter.ts';
import { KtParameter } from './parameter.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    description?: Nullable<BasicAppendValue<TBuilder>>;
    tags?: Nullable<Nullable<KtDocTag<TBuilder>>[]>;
  }
>;

/**
 * Represents a KDoc comment block that is written above a declaration. The block is omitted when it has neither a
 * description nor tags.
 *
 * Written in this order: the description, a blank line, then the tags. Every line of the block is prefixed with an
 * asterisk.
 *
 * @template TBuilder The type of the source builder the doc comment is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktDoc
 */
export class KtDoc<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The text written at the start of the block, or `null` to write only the tags.
   */
  public description: BasicAppendValue<TBuilder> | null;
  /**
   * The tags written after the description, one per line, such as `@param` or `@see`. Tags that `ktDoc.get` generates
   * from the descriptions of generic and value parameters are placed before these tags.
   */
  public tags: KtDocTag<TBuilder>[];

  /**
   * Initializes a new instance of the KtDoc class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.description = options.description ?? null;
    this.tags = options.tags?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    if (!this.description && this.tags.length === 0) return;
    builder
      .ensureCurrentLineEmpty()
      .parenthesize(
        ['/**', ' */'],
        (b) =>
          b.appendWithLinePrefix(' * ', (b) => {
            builder.append(this.description);
            if (this.tags.length > 0) {
              b.ensurePreviousLineEmpty();
              ktDocTag.write(b, this.tags);
            }
          }),
        { multiline: true, indent: false },
      )
      .appendLine();
  }
}

const createDoc = <TBuilder extends SourceBuilder>(
  description?: Options<TBuilder>['description'],
  tags?: Options<TBuilder>['tags'],
  options?: Prettify<Omit<Options<TBuilder>, 'description' | 'tags'>>,
): KtDoc<TBuilder> => new KtDoc<TBuilder>({ ...options, description, tags: tags ?? undefined });

function getDoc<TBuilder extends SourceBuilder>(
  baseDoc: KtDoc<TBuilder> | null,
  options: {
    parameters?: Nullable<Nullable<KtParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    generics?: Nullable<Nullable<KtGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
  },
): KtDoc<TBuilder> | null {
  const paramsWithDesc =
    options.parameters
      ?.filter(getIsInstanceOf(KtParameter<TBuilder>))
      .filter((x): x is KtParameter<TBuilder> & { description: NonNullable<unknown> } => !!x.description) ?? [];
  const classParamsWithPropertyDesc =
    options.parameters
      ?.filter(getIsInstanceOf(KtParameter<TBuilder>))
      .filter(
        (
          x,
        ): x is KtParameter<TBuilder> & { property: NonNullable<unknown>; propertyDescription: NonNullable<unknown> } =>
          !!x.property && !!x.propertyDescription,
      ) ?? [];
  const genericsWithDesc =
    options.generics
      ?.filter(getIsInstanceOf(KtGenericParameter<TBuilder>))
      .filter((x): x is KtGenericParameter<TBuilder> & { description: NonNullable<unknown> } => !!x.description) ?? [];
  if (
    baseDoc === null &&
    paramsWithDesc.length === 0 &&
    genericsWithDesc.length === 0 &&
    classParamsWithPropertyDesc.length === 0
  ) {
    return null;
  }

  const doc = baseDoc ? createOverwriteProxy(baseDoc) : ktDoc<TBuilder>();
  const paramTags = paramsWithDesc.map<KtDocTag<TBuilder>>((p) => ktDocTag('param', p.name, p.description));
  const propertyTags = classParamsWithPropertyDesc.map<KtDocTag<TBuilder>>((p) =>
    ktDocTag('property', p.name, p.propertyDescription),
  );
  const genericTags = genericsWithDesc.map<KtDocTag<TBuilder>>((p) => ktDocTag('param', p.name, p.description));
  doc.tags.splice(0, 0, ...genericTags, ...paramTags, ...propertyTags);
  return doc;
}

/**
 * Factory for creating doc comment nodes. The `write` function writes one or more doc comments to a builder. The `get`
 * function returns the doc comment of a declaration with the descriptions of its generic and parameters added as tags,
 * or `null` when there is nothing to write.
 *
 * @param description The text at the start of the block, or `null` for none.
 * @param tags The tags written after the description.
 * @param options The settings of the doc comment. See `KtDoc` for the available properties.
 * @example
 * ```ts
 * ktDoc('Returns the pet with the given id.', [
 *   ktDocTag('param', 'id', 'The identifier of the pet.'),
 *   ktDocTag('return', 'The pet, or null.'),
 * ]);
 * // Emits a KDoc block with one line per entry, which is closed after the last tag:
 * // /**
 * // * Returns the pet with the given id.
 * // *
 * // * @param id The identifier of the pet.
 * // * @return The pet, or null.
 * ```
 */
export const ktDoc: typeof createDoc & {
  write: typeof writeKtNodes;
  get: typeof getDoc;
} = Object.assign(createDoc, {
  write: writeKtNodes,
  get: getDoc,
});
