import {
  SourceBuilder,
  AppendValue,
  AstNodeOptions,
  createOverwriteProxy,
  Prettify,
  Nullable,
  SingleOrMultiple,
  toArray,
  notNullish,
} from '@goast/core';

import { KtDocTag, ktDocTag } from './doc-tag';
import { KtGenericParameter } from './generic-parameter';
import { KtParameter } from './parameter';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    description?: Nullable<AppendValue<TBuilder>>;
    tags?: Nullable<Nullable<KtDocTag<TBuilder>>[]>;
  }
>;

export class KtDoc<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public description: AppendValue<TBuilder> | null;
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
          b.appendWithLinePrefix(' * ', (b) =>
            b
              .appendIf(!!this.description, this.description)
              .appendLineIf(!!this.description && this.tags.length > 0, '\n')
              .append((b) => ktDocTag.write(b, this.tags)),
          ),
        { multiline: true, indent: false },
      )
      .appendLine();
  }
}

const createDoc = <TBuilder extends SourceBuilder>(
  description?: Options<TBuilder>['description'],
  tags?: Options<TBuilder>['tags'],
  options?: Prettify<Omit<Options<TBuilder>, 'description' | 'tags'>>,
) => new KtDoc<TBuilder>({ ...options, description, tags: tags ?? undefined });

const writeDocs = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtDoc<TBuilder> | AppendValue<TBuilder>>>,
) => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, writeKt, { separator: '\n' });
};

function getDoc<TBuilder extends SourceBuilder>(
  baseDoc: KtDoc<TBuilder> | null,
  options: {
    parameters?: Nullable<Nullable<KtParameter<TBuilder>>[]>;
    generics?: Nullable<Nullable<KtGenericParameter<TBuilder>>[]>;
  },
): KtDoc<TBuilder> | null {
  const paramsWithDesc =
    options.parameters
      ?.filter(notNullish)
      .filter((x): x is KtParameter<TBuilder> & { description: {} } => !!x.description) ?? [];
  const classParamsWithPropertyDesc =
    options.parameters
      ?.filter(notNullish)
      .filter(
        (x): x is KtParameter<TBuilder> & { property: {}; propertyDescription: {} } =>
          !!x.property && !!x.propertyDescription,
      ) ?? [];
  const genericsWithDesc =
    options.generics
      ?.filter(notNullish)
      .filter((x): x is KtGenericParameter<TBuilder> & { description: {} } => !!x.description) ?? [];
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

export const ktDoc = Object.assign(createDoc, {
  write: writeDocs,
  get: getDoc,
});
