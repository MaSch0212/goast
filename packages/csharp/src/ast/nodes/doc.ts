import {
  type AstNodeOptions,
  type BasicAppendValue,
  getIsInstanceOf,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { CsNode } from '../node.ts';
import { writeCsNodes } from '../utils/write-cs-node.ts';
import { type CsDocTag, csDocTag } from './doc-tag.ts';
import { CsGenericParameter } from './generic-parameter.ts';
import { CsParameter } from './parameter.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    /** The text of the `<summary>` element. */
    summary?: Nullable<string>;
    /** Further elements written after the summary (`<param>`, `<returns>`, `<remarks>`, ...). */
    tags?: Nullable<Nullable<CsDocTag<TBuilder>>[]>;
  }
>;

/** An XML documentation comment, written as `/// ` prefixed lines. */
export class CsDoc<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public summary: string | null;
  public tags: CsDocTag<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.summary = options.summary ?? null;
    this.tags = options.tags?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    if (!this.summary && this.tags.length === 0) return;
    builder
      .ensureCurrentLineEmpty()
      .appendWithLinePrefix('/// ', (b) => {
        if (this.summary) {
          csDocTag.summary(this.summary).write(b);
          if (this.tags.length > 0) b.appendLine();
        }
        csDocTag.write(b, this.tags);
      })
      .ensureCurrentLineEmpty();
  }
}

const createDoc = <TBuilder extends SourceBuilder>(
  summary?: Options<TBuilder>['summary'],
  tags?: Options<TBuilder>['tags'],
  options?: Prettify<Omit<Options<TBuilder>, 'summary' | 'tags'>>,
): CsDoc<TBuilder> => new CsDoc<TBuilder>({ ...options, summary, tags: tags ?? undefined });

/**
 * Completes `baseDoc` with `<typeparam>` and `<param>` elements for generic parameters and parameters that have a
 * description. Returns `null` if there is nothing to document.
 */
function getDoc<TBuilder extends SourceBuilder>(
  baseDoc: CsDoc<TBuilder> | null,
  options: {
    parameters?: Nullable<Nullable<CsParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    generics?: Nullable<Nullable<CsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
  },
): CsDoc<TBuilder> | null {
  const paramsWithDesc =
    options.parameters
      ?.filter(getIsInstanceOf(CsParameter<TBuilder>))
      .filter(
        (x): x is CsParameter<TBuilder> & { description: string } =>
          typeof x.description === 'string' && !!x.description,
      ) ?? [];
  const genericsWithDesc =
    options.generics
      ?.filter(getIsInstanceOf(CsGenericParameter<TBuilder>))
      .filter(
        (x): x is CsGenericParameter<TBuilder> & { description: string } =>
          typeof x.description === 'string' && !!x.description,
      ) ?? [];
  if (baseDoc === null && paramsWithDesc.length === 0 && genericsWithDesc.length === 0) {
    return null;
  }

  const genericTags = genericsWithDesc.map((p) => csDocTag.typeparam<TBuilder>(p.name, p.description));
  const paramTags = paramsWithDesc.map((p) => csDocTag.param<TBuilder>(p.name, p.description));
  return new CsDoc<TBuilder>({
    inject: baseDoc?.inject,
    summary: baseDoc?.summary,
    tags: [...genericTags, ...paramTags, ...(baseDoc?.tags ?? [])],
  });
}

export const csDoc: typeof createDoc & {
  write: typeof writeCsNodes;
  get: typeof getDoc;
} = Object.assign(createDoc, {
  write: writeCsNodes,
  get: getDoc,
});
