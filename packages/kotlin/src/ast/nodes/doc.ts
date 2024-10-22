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

export class KtDoc<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public description: BasicAppendValue<TBuilder> | null;
  public tags: KtDocTag<TBuilder>[];

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
  const paramsWithDesc = options.parameters
    ?.filter(getIsInstanceOf(KtParameter<TBuilder>))
    .filter((x): x is KtParameter<TBuilder> & { description: NonNullable<unknown> } => !!x.description) ?? [];
  const classParamsWithPropertyDesc = options.parameters
    ?.filter(getIsInstanceOf(KtParameter<TBuilder>))
    .filter(
      (x): x is KtParameter<TBuilder> & { property: NonNullable<unknown>; propertyDescription: NonNullable<unknown> } =>
        !!x.property && !!x.propertyDescription,
    ) ?? [];
  const genericsWithDesc = options.generics
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
    ktDocTag('property', p.name, p.propertyDescription)
  );
  const genericTags = genericsWithDesc.map<KtDocTag<TBuilder>>((p) => ktDocTag('param', p.name, p.description));
  doc.tags.splice(0, 0, ...genericTags, ...paramTags, ...propertyTags);
  return doc;
}

export const ktDoc: typeof createDoc & {
  write: typeof writeKtNodes;
  get: typeof getDoc;
} = Object.assign(createDoc, {
  write: writeKtNodes,
  get: getDoc,
});
