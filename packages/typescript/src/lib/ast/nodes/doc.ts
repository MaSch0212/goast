import {
  type AstNodeOptions,
  type BasicAppendValue,
  createOverwriteProxy,
  getIsInstanceOf,
  notNullish,
  type Nullable,
  type SourceBuilder,
} from '@goast/core';

import { type TsDocTag, tsDocTag } from './doc-tag.ts';
import { TsGenericParameter } from './generic-parameter.ts';
import { TsParameter } from './parameter.ts';
import { TsNode } from '../node.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    description?: Nullable<BasicAppendValue<TBuilder>>;
    tags?: Nullable<Nullable<TsDocTag<TBuilder>>[]>;
  }
>;

export class TsDoc<TBuilder extends SourceBuilder, TInjects extends string = never>
  extends TsNode<TBuilder, TInjects | Injects> {
  public description: BasicAppendValue<TBuilder> | null;
  public tags: TsDocTag<TBuilder>[];

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

const createDoc = <TBuilder extends SourceBuilder>(options?: Options<TBuilder>) => new TsDoc<TBuilder>(options ?? {});

function getDoc<TBuilder extends SourceBuilder>(
  baseDoc: TsDoc<TBuilder> | null,
  options: {
    parameters?: Nullable<Nullable<TsParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    generics?: Nullable<Nullable<TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
  },
): TsDoc<TBuilder> | null {
  const paramsWithDesc = options.parameters
    ?.filter(getIsInstanceOf(TsParameter<TBuilder>))
    .filter((x): x is TsParameter<TBuilder> & { description: {} } => !!x.description) ?? [];
  const genericsWithDesc = options.generics
    ?.filter(getIsInstanceOf(TsGenericParameter<TBuilder>))
    .filter((x): x is TsGenericParameter<TBuilder> & { description: {} } => !!x.description) ?? [];
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

export const tsDoc = Object.assign(createDoc, {
  write: writeTsNodes,
  get: getDoc,
  isEmpty: isDocEmpty,
});
