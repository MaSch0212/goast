import {
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
  type TupleWithCount,
} from '@goast/core';

import { KotlinFileBuilder } from '../../file-builder.ts';
import { KtNode } from '../node.ts';
import { writeKtNode, writeKtNodes } from '../utils/write-kt-node.ts';
import { ktGenericParameter } from './generic-parameter.ts';
import type { KtType } from './types.ts';

import type { KtCall } from './call.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    packageName?: Nullable<string>;
    generics?: Nullable<Nullable<KtType<TBuilder>>[]>;
    nullable?: Nullable<boolean>;
    classReference?: Nullable<boolean>;
    subReference?: Nullable<KtReference<TBuilder> | KtCall<TBuilder>>;
  }
>;

type _AddImportHandler<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  builderClass: abstract new (...args: any) => T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (builder: T, reference: KtReference<any>) => void;
};

export class KtReference<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static readonly addImportHandlers: _AddImportHandler<any>[] = [
    {
      builderClass: KotlinFileBuilder,
      handler: (builder, reference) => builder.addImport(reference.name, reference.packageName),
    },
  ];

  public name: string;
  public packageName: string | null;
  public generics: KtType<TBuilder>[];
  public nullable: boolean;
  public classReference: boolean;
  public subReference: KtReference<TBuilder> | KtCall<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.packageName = options.packageName ?? null;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.nullable = options.nullable ?? false;
    this.classReference = options.classReference ?? false;
    this.subReference = options.subReference ?? null;
  }

  public addImport(builder: TBuilder): void {
    if (this.packageName) {
      const handler = KtReference.addImportHandlers.find((h) => builder instanceof h.builderClass);
      if (handler) {
        handler.handler(builder, this);
      }
    }
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.name);
    ktGenericParameter.write(builder, this.generics);
    if (this.classReference) {
      builder.append('::class');
    } else if (this.subReference) {
      builder.append('::');
      writeKtNode(builder, this.subReference);
    } else if (this.nullable) {
      builder.append('?');
    }

    this.addImport(builder);
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
  return Object.assign(
    <TBuilder extends SourceBuilder>(options?: Prettify<Omit<Options<TBuilder>, 'name' | 'packageName'>>) =>
      createReference<TBuilder>(name, packageName, options),
    {
      refName: name,
      packageName,
      matches: (value: unknown): value is KtReference<never> =>
        value instanceof KtReference && value.name === name && value.packageName === (packageName ?? null),
    },
  );
};

const createGenericFactory = <TGenericCount extends number | number[]>(
  name: string,
  packageName?: Nullable<string>,
) => {
  return Object.assign(
    <TBuilder extends SourceBuilder>(
      generics: TupleWithCount<KtType<TBuilder>, TGenericCount>,
      options?: Prettify<Omit<Options<TBuilder>, 'name' | 'packageName' | 'generics'>>,
    ) => createReference<TBuilder>(name, packageName, { ...options, generics }),
    {
      refName: name,
      packageName,
      infer: <TBuilder extends SourceBuilder>(
        options?: Prettify<Omit<Options<TBuilder>, 'name' | 'packageName' | 'generics'>>,
      ) => createReference<TBuilder>(name, packageName, options),
      matches: (value: unknown): value is KtReference<never> =>
        value instanceof KtReference && value.name === name && value.packageName === (packageName ?? null),
    },
  );
};

const importRefs = <TBuilder extends SourceBuilder>(builder: TBuilder, references: KtReference<TBuilder>[]) => {
  references.forEach((ref) => ref.addImport(builder));
};

export const ktReference = Object.assign(createReference, {
  factory: createFactory,
  genericFactory: createGenericFactory,
  write: writeKtNodes,
  import: importRefs,
});
