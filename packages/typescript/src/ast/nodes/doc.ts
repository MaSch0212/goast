import {
  type AstNodeOptions,
  type BasicAppendValue,
  createOverwriteProxy,
  getIsInstanceOf,
  notNullish,
  type Nullable,
  type SourceBuilder,
} from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';
import { type TsDocTag, tsDocTag } from './doc-tag.ts';
import { TsGenericParameter } from './generic-parameter.ts';
import { TsParameter } from './parameter.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    description?: Nullable<BasicAppendValue<TBuilder>>;
    tags?: Nullable<Nullable<TsDocTag<TBuilder>>[]>;
  }
>;

/**
 * Represents a doc comment, which is written above the node that it documents. Nothing is written when the doc has
 * neither a description nor tags.
 *
 * Written in this order: the description, an empty line when both a description and tags are set, then the tags, one
 * per line. The comment starts on its own line and is followed by a line break.
 *
 * @template TBuilder The type of the source builder the doc comment is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsDoc
 */
export class TsDoc<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The text at the top of the doc comment. Each line of the text is prefixed with an asterisk. Nothing is written when
   * `null`.
   */
  public description: BasicAppendValue<TBuilder> | null;
  /**
   * The tags written below the description, one per line, such as `@param` or `@returns`. An empty line separates them
   * from the description.
   */
  public tags: TsDocTag<TBuilder>[];

  /**
   * Initializes a new instance of the TsDoc class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.description = options.description ?? null;
    this.tags = options.tags?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    if (!this.description && this.tags.length === 0) {
      return;
    }

    builder
      .ensureCurrentLineEmpty()
      .parenthesize(
        ['/**', ' */'],
        (b) =>
          b.appendWithLinePrefix(' * ', (b) => {
            if (this.description) {
              b.append(this.description);
            }

            if (this.tags.length > 0) {
              b.ensurePreviousLineEmpty();
              tsDocTag.write(b, this.tags, { separator: '\n' });
            }
          }),
        { multiline: true, indent: false },
      )
      .appendLine();
  }
}

const createDoc = <TBuilder extends SourceBuilder>(options?: Options<TBuilder>): TsDoc<TBuilder> =>
  new TsDoc<TBuilder>(options ?? {});

function getDoc<TBuilder extends SourceBuilder>(
  baseDoc: TsDoc<TBuilder> | null,
  options: {
    parameters?: Nullable<Nullable<TsParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    generics?: Nullable<Nullable<TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
  },
): TsDoc<TBuilder> | null {
  const paramsWithDesc =
    options.parameters
      ?.filter(getIsInstanceOf(TsParameter<TBuilder>))
      .filter((x): x is TsParameter<TBuilder> & { description: NonNullable<unknown> } => !!x.description) ?? [];
  const genericsWithDesc =
    options.generics
      ?.filter(getIsInstanceOf(TsGenericParameter<TBuilder>))
      .filter((x): x is TsGenericParameter<TBuilder> & { description: NonNullable<unknown> } => !!x.description) ?? [];
  if (paramsWithDesc.length === 0 && genericsWithDesc.length === 0) {
    return baseDoc;
  }
  const doc = baseDoc ? createOverwriteProxy(baseDoc) : createDoc<TBuilder>();
  const paramTags = paramsWithDesc.map<TsDocTag<TBuilder>>((p) => tsDocTag('param', p.name, p.description));
  const genericTags = genericsWithDesc.map<TsDocTag<TBuilder>>((p) => tsDocTag('template', p.name, p.description));
  doc.tags.splice(0, 0, ...genericTags, ...paramTags);
  return doc;
}

function isDocEmpty(doc: Nullable<TsDoc<SourceBuilder>>): boolean {
  return !doc || (!doc.description && doc.tags.length === 0);
}

/**
 * Factory for creating doc comment nodes. The `write` function writes a doc comment to a builder. The `get` function
 * returns a doc with `@template` tags for the described generics and `@param` tags for the described parameters, placed
 * before the existing tags. The `isEmpty` function tells whether a doc has nothing to write.
 *
 * @param options The settings of the doc comment. See `TsDoc` for the available properties.
 * @example
 * ```ts
 * tsDoc({ description: 'Creates a user.', tags: [tsDocTag('returns', 'The new user.')] });
 * // Emits the lines of the doc comment. The opening and closing delimiters are left out here:
 * // Creates a user.
 * //
 * // @returns The new user.
 * ```
 */
export const tsDoc: typeof createDoc & {
  write: typeof writeTsNodes;
  get: typeof getDoc;
  isEmpty: typeof isDocEmpty;
} = Object.assign(createDoc, {
  write: writeTsNodes,
  get: getDoc,
  isEmpty: isDocEmpty,
});
