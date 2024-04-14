import { AstNodeOptions, Nullable, Prettify, SourceBuilder, TupleWithCount, notNullish } from '@goast/core';

import { TsType } from './types';
import { TypeScriptFileBuilder } from '../../file-builder';
import { TsNode } from '../node';
import { writeTsGenericParameters } from '../utils/write-ts-generic-parameters';
import { writeTsNodes } from '../utils/write-ts-nodes';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    moduleNameOrfilePath?: Nullable<string>;
    generics?: Nullable<Nullable<TsType<TBuilder>>[]>;
  }
>;

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
      handler: (builder, reference) => builder.addImport(reference.name, reference.moduleNameOrfilePath),
    },
  ];

  public name: string;
  public moduleNameOrfilePath: string | null;
  public generics: TsType<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.moduleNameOrfilePath = options.moduleNameOrfilePath ?? null;
    this.generics = options.generics?.filter(notNullish) ?? [];
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
) => new TsReference<TBuilder>({ ...options, name, moduleNameOrfilePath });

function _createFactory(name: string, moduleNameOrfilePath?: Nullable<string>) {
  return Object.assign(<TBuilder extends SourceBuilder>() => createReference<TBuilder>(name, moduleNameOrfilePath), {
    refName: name,
    moduleNameOrfilePath,
  });
}
function createFactory(
  name: string,
  moduleNameOrfilePath: string,
): ReturnType<typeof _createFactory> & { moduleNameOrfilePath: string };
function createFactory(name: string, moduleNameOrfilePath?: Nullable<string>): ReturnType<typeof _createFactory>;
function createFactory(name: string, moduleNameOrfilePath?: Nullable<string>) {
  return _createFactory(name, moduleNameOrfilePath);
}

function _createGenericFactory<TGenericCount extends number | number[]>(
  name: string,
  moduleNameOrfilePath?: Nullable<string>,
) {
  return Object.assign(
    <TBuilder extends SourceBuilder>(generics: TupleWithCount<TsType<TBuilder>, TGenericCount>) =>
      createReference<TBuilder>(name, moduleNameOrfilePath, { generics }),
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
): ReturnType<typeof _createGenericFactory<TGenericCount>> & { moduleNameOrfilePath: string };
function createGenericFactory<TGenericCount extends number | number[]>(
  name: string,
  moduleNameOrfilePath?: Nullable<string>,
): ReturnType<typeof _createGenericFactory<TGenericCount>>;
function createGenericFactory<TGenericCount extends number | number[]>(
  name: string,
  moduleNameOrfilePath?: Nullable<string>,
) {
  return _createGenericFactory<TGenericCount>(name, moduleNameOrfilePath);
}

export const tsReference = Object.assign(createReference, {
  factory: createFactory,
  genericFactory: createGenericFactory,
  write: writeTsNodes,
});
