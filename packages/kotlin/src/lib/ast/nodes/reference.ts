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
  notNullish,
} from '@goast/core';

import { KotlinFileBuilder } from '../../file-builder';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    packageName?: Nullable<string>;
    generics?: Nullable<Nullable<AppendValue<TBuilder>>[]>;
    nullable?: Nullable<boolean>;
  }
>;

type _AddImportHandler<T> = {
  builderClass: abstract new (...args: any) => T;
  handler: (builder: T, reference: KtReference<any>) => void;
};

export class KtReference<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
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

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.packageName = options.packageName ?? null;
    this.generics = options.generics?.filter(notNullish) ?? [];
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
    builderClass: _AddImportHandler<TBuilder>['builderClass'],
    handler: _AddImportHandler<TBuilder>['handler'],
  ): void {
    KtReference.addImportHandlers.push({ builderClass, handler });
  }
}

const createReference = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  packageName?: Options<TBuilder>['packageName'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'packageName'>>,
) => new KtReference<TBuilder>({ ...options, name, packageName });

const createFactory = (name: string, packageName?: Nullable<string>) => {
  return <TBuilder extends SourceBuilder>(nullable?: boolean) =>
    createReference<TBuilder>(name, packageName, { nullable });
};

const createGenericFactory = <TGenericCount extends number | number[]>(
  name: string,
  packageName?: Nullable<string>,
) => {
  return Object.assign(
    <TBuilder extends SourceBuilder>(
      generics: TupleWithCount<AppendValue<TBuilder>, TGenericCount>,
      nullable?: boolean,
    ) => createReference<TBuilder>(name, packageName, { generics, nullable }),
    {
      infer: <TBuilder extends SourceBuilder>(nullable?: boolean) =>
        createReference<TBuilder>(name, packageName, { nullable }),
    },
  );
};

const writeReferences = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtReference<TBuilder> | AppendValue<TBuilder>>>,
  options?: { separator?: Separator<TBuilder, KtReference<TBuilder> | AppendValue<TBuilder>> },
) => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, writeKt, { separator: options?.separator });
};

export const ktReference = Object.assign(createReference, {
  factory: createFactory,
  genericFactory: createGenericFactory,
  write: writeReferences,
});
