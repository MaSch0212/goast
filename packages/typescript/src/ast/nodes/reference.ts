import {
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
  type TupleWithCount,
} from '@goast/core';

import type { TypeScriptImportType } from '../../common-results.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { TsNode } from '../node.ts';
import { writeTsGenericParameters } from '../utils/write-ts-generic-parameters.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    moduleNameOrfilePath?: Nullable<string>;
    generics?: Nullable<Nullable<TsType<TBuilder>>[]>;
    importType?: Nullable<TypeScriptImportType>;
  }
>;
type FactoryOptions<TBuilder extends SourceBuilder> = {
  importType?: Nullable<TypeScriptImportType>;
};

type _AddImportHandler<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  builderClass: abstract new (...args: any[]) => T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (builder: T, reference: TsReference<any>) => void;
};

export class TsReference<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static readonly addImportHandlers: _AddImportHandler<any>[] = [
    {
      builderClass: TypeScriptFileBuilder,
      handler: (builder: TypeScriptFileBuilder, reference) => {
        if (reference.moduleNameOrfilePath) {
          builder.addImport(reference.name, reference.moduleNameOrfilePath, { type: reference.importType });
        }
      },
    },
  ];

  public name: string;
  public moduleNameOrfilePath: string | null;
  public generics: TsType<TBuilder>[];
  public importType: TypeScriptImportType;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.moduleNameOrfilePath = options.moduleNameOrfilePath ?? null;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.importType = options.importType ?? 'import';
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.name);
    writeTsGenericParameters(builder, this.generics);
    if (this.moduleNameOrfilePath) {
      const handler = TsReference.addImportHandlers.find((h) => builder instanceof h.builderClass);
      if (handler) {
        handler.handler(builder, this);
      }
    }
  }

  public static registerAddImportHandler<TBuilder extends SourceBuilder>(
    builderClass: _AddImportHandler<TBuilder>['builderClass'],
    handler: _AddImportHandler<TBuilder>['handler'],
  ): void {
    TsReference.addImportHandlers.push({ builderClass, handler });
  }
}

const createReference = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  moduleNameOrfilePath?: Options<TBuilder>['moduleNameOrfilePath'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'moduleNameOrfilePath'>>,
): TsReference<TBuilder> => new TsReference<TBuilder>({ ...options, name, moduleNameOrfilePath });

export type TsReferenceFactory =
  & (<TBuilder extends SourceBuilder>(options?: FactoryOptions<TBuilder>) => TsReference<TBuilder>)
  & {
    refName: string;
    moduleNameOrfilePath: Nullable<string>;
  };
export type TsModuleReferenceFactory = TsReferenceFactory & {
  moduleNameOrfilePath: string;
};

export type TsGenericReferenceFactory<TGenericCount extends number | number[]> =
  & (<TBuilder extends SourceBuilder>(
    generics: TupleWithCount<TsType<TBuilder>, TGenericCount>,
    options?: FactoryOptions<TBuilder>,
  ) => TsReference<TBuilder>)
  & {
    refName: string;
    moduleNameOrfilePath: Nullable<string>;
    infer: <TBuilder extends SourceBuilder>() => TsReference<TBuilder>;
  };
export type TsGenericModuleReferenceFactory<TGenericCount extends number | number[]> =
  & TsGenericReferenceFactory<TGenericCount>
  & {
    moduleNameOrfilePath: string;
  };

function _createFactory(
  name: string,
  moduleNameOrfilePath?: Nullable<string>,
  defaultOptions?: { importType?: Nullable<TypeScriptImportType> },
): TsReferenceFactory {
  return Object.assign(
    <TBuilder extends SourceBuilder>(options?: FactoryOptions<TBuilder>) =>
      createReference<TBuilder>(name, moduleNameOrfilePath, { ...defaultOptions, ...options }),
    {
      refName: name,
      moduleNameOrfilePath,
    },
  );
}
function createFactory(
  name: string,
  moduleNameOrfilePath: string,
  defaultOptions?: { importType?: Nullable<TypeScriptImportType> },
): TsModuleReferenceFactory;
function createFactory(
  name: string,
  moduleNameOrfilePath?: Nullable<string>,
  defaultOptions?: { importType?: Nullable<TypeScriptImportType> },
): TsReferenceFactory;
function createFactory(
  name: string,
  moduleNameOrfilePath?: Nullable<string>,
  defaultOptions?: { importType?: Nullable<TypeScriptImportType> },
): TsReferenceFactory {
  return _createFactory(name, moduleNameOrfilePath, defaultOptions);
}

function _createGenericFactory<TGenericCount extends number | number[]>(
  name: string,
  moduleNameOrfilePath?: Nullable<string>,
  defaultOptions?: { importType?: Nullable<TypeScriptImportType> },
): TsGenericReferenceFactory<TGenericCount> {
  return Object.assign(
    <TBuilder extends SourceBuilder>(
      generics: TupleWithCount<TsType<TBuilder>, TGenericCount>,
      options?: FactoryOptions<TBuilder>,
    ) => createReference<TBuilder>(name, moduleNameOrfilePath, { ...defaultOptions, ...options, generics }),
    {
      refName: name,
      moduleNameOrfilePath,
      infer: <TBuilder extends SourceBuilder>() => createReference<TBuilder>(name, moduleNameOrfilePath),
    },
  );
}
function createGenericFactory<TGenericCount extends number | number[]>(
  name: string,
  moduleNameOrfilePath: string,
  defaultOptions?: { importType?: Nullable<TypeScriptImportType> },
): TsGenericModuleReferenceFactory<TGenericCount>;
function createGenericFactory<TGenericCount extends number | number[]>(
  name: string,
  moduleNameOrfilePath?: Nullable<string>,
  defaultOptions?: { importType?: Nullable<TypeScriptImportType> },
): TsGenericReferenceFactory<TGenericCount>;
function createGenericFactory<TGenericCount extends number | number[]>(
  name: string,
  moduleNameOrfilePath?: Nullable<string>,
  defaultOptions?: { importType?: Nullable<TypeScriptImportType> },
): TsGenericReferenceFactory<TGenericCount> {
  return _createGenericFactory<TGenericCount>(name, moduleNameOrfilePath, defaultOptions);
}

export const tsReference: typeof createReference & {
  factory: typeof createFactory;
  genericFactory: typeof createGenericFactory;
  write: typeof writeTsNodes;
} = Object.assign(createReference, {
  factory: createFactory,
  genericFactory: createGenericFactory,
  write: writeTsNodes,
});
