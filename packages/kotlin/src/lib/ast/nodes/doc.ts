import {
  SourceBuilder,
  AppendValue,
  AstNodeOptions,
  createOverwriteProxy,
  Prettify,
  Nullable,
  SingleOrMultiple,
  toArray,
} from '@goast/core';

import { KtDocTag, ktDocTag } from './doc-tag';
import { KtGenericParameter } from './generic-parameter';
import { KtParameter } from './parameter';
import { KotlinFileBuilder } from '../../file-builder';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type KtDocOptions<TBuilder extends SourceBuilder> = AstNodeOptions<KtDoc<TBuilder>, typeof KtNode<TBuilder>>;

export class KtDoc<TBuilder extends SourceBuilder = KotlinFileBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects
> {
  public description: AppendValue<TBuilder>;
  public tags: KtDocTag<TBuilder>[];

  constructor(options: KtDocOptions<TBuilder>) {
    super(options);
    this.description = options.description;
    this.tags = options.tags ?? [];
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
              .append((b) => ktDocTag.write(b, this.tags))
          ),
        { multiline: true, indent: false }
      )
      .appendLine();
  }
}

const createDoc = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  description?: Nullable<KtDocTag<TBuilder>['description']>,
  tags?: Nullable<KtDoc<TBuilder>['tags']>,
  options?: Prettify<Omit<KtDocOptions<TBuilder>, 'description' | 'tags'>>
) => new KtDoc<TBuilder>({ ...options, description, tags: tags ?? undefined });

const writeDocs = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<KtDoc<TBuilder> | AppendValue<TBuilder>>
) => {
  builder.forEach(toArray(nodes), writeKt, { separator: '\n' });
};

function getDoc<TBuilder extends SourceBuilder = KotlinFileBuilder>(
  baseDoc: KtDoc<TBuilder> | null,
  options: {
    parameters?: KtParameter<TBuilder>[];
    generics?: KtGenericParameter<TBuilder>[];
  }
): KtDoc<TBuilder> | null {
  const paramsWithDesc = options.parameters?.filter((x) => x.description) ?? [];
  const classParamsWithPropertyDesc = options.parameters?.filter((x) => x.property && x.propertyDescription) ?? [];
  const genericsWithDesc = options.generics?.filter((x) => x.description) ?? [];
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

export const ktDoc = Object.assign(createDoc, {
  write: writeDocs,
  get: getDoc,
});
