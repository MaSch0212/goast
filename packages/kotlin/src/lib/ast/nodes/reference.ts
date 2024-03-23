import {
  SourceBuilder,
  AppendValue,
  AstNodeOptions,
  Nullable,
  Prettify,
  TupleWithCount,
  SingleOrMultiple,
  Separator,
  toArray,
} from '@goast/core';

import { KotlinFileBuilder } from '../../file-builder';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type KtReferenceOptions<TBuilder extends SourceBuilder> = AstNodeOptions<
  KtReference<TBuilder>,
  typeof KtNode<TBuilder>,
  'name'
>;

type _AddImportHandler<T> = {
  builderClass: abstract new (...args: any) => T;
  handler: (builder: T, reference: KtReference<any>) => void;
};

export class KtReference<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects
> {
  private static readonly addImportHandlers: _AddImportHandler<any>[] = [
    {
      builderClass: KotlinFileBuilder,
      handler: (builder, reference) => builder.addImport(reference.name, reference.packageName),
    },
  ];

  public name: string;
  public packageName: string | null;
  public generics: AppendValue<TBuilder>[];
  public nullable: boolean;

  constructor(options: KtReferenceOptions<TBuilder>) {
    super(options);
    this.name = options.name;
    this.packageName = options.packageName ?? null;
    this.generics = options.generics ?? [];
    this.nullable = options.nullable ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.name);
    if (this.generics.length > 0) {
      builder.parenthesize('<>', (b) => b.forEach(this.generics, (b, g) => b.append(g), { separator: ', ' }));
    }
    if (this.packageName) {
      const handler = KtReference.addImportHandlers.find((h) => builder instanceof h.builderClass);
      if (handler) {
        handler.handler(builder, this);
      }
    }
    builder.appendIf(this.nullable, '?');
  }

  public static registerAddImportHandler<TBuilder extends SourceBuilder>(
    builderClass: abstract new (...args: any) => TBuilder,
    handler: (builder: TBuilder, reference: KtReference<any>) => void
  ): void {
    KtReference.addImportHandlers.push({ builderClass, handler });
  }
}

const createReference = <TBuilder extends SourceBuilder>(
  name: KtReference<TBuilder>['name'],
  packageName?: Nullable<KtReference<TBuilder>['packageName']>,
  options?: Prettify<Omit<KtReferenceOptions<TBuilder>, 'name' | 'packageName'>>
) => new KtReference<TBuilder>({ ...options, name, packageName });

const createFactory = <TBuilder extends SourceBuilder = SourceBuilder>(
  name: KtReference<TBuilder>['name'],
  packageName?: Nullable<KtReference<TBuilder>['packageName']>,
  options?: Prettify<Omit<KtReferenceOptions<TBuilder>, 'name' | 'packageName'>>
) => {
  return (nullable?: boolean) =>
    createReference(name, packageName, { ...options, nullable: nullable ?? options?.nullable });
};

const createGenericFactory = <TGenericCount extends number | number[], TBuilder extends SourceBuilder = SourceBuilder>(
  name: KtReference<TBuilder>['name'],
  packageName?: Nullable<KtReference<TBuilder>['packageName']>,
  options?: Prettify<Omit<KtReferenceOptions<TBuilder>, 'name' | 'packageName'>>
) => {
  return Object.assign(
    <B extends TBuilder>(generics: TupleWithCount<AppendValue<B>, TGenericCount>, nullable?: boolean) =>
      createReference<B>(name, packageName, { ...options, generics, nullable: nullable ?? options?.nullable }),
    {
      infer: (nullable?: boolean) =>
        createReference(name, packageName, { ...options, nullable: nullable ?? options?.nullable }),
    }
  );
};

const writeReferences = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<KtReference<TBuilder> | AppendValue<TBuilder>>,
  options?: { separator: Separator<TBuilder, KtReference<TBuilder> | AppendValue<TBuilder>> }
) => {
  builder.forEach(toArray(nodes), writeKt, { separator: options?.separator });
};

export const ktReference = Object.assign(createReference, {
  factory: createFactory,
  genericFactory: createGenericFactory,
  write: writeReferences,
});
