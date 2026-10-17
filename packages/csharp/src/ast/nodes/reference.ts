import {
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
  type TupleWithCount,
} from '@goast/core';

import { CSharpFileBuilder } from '../../file-builder.ts';
import { CsNode } from '../node.ts';
import { writeCsGenericParameters } from '../utils/write-cs-generic-parameters.ts';
import { writeCsNode, writeCsNodes } from '../utils/write-cs-node.ts';
import type { CsType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    /**
     * The name of the type. Nested types can be referenced with a dotted name (`Outer.Inner`); C# keyword aliases
     * (`string`, `int`, ...) are references without a namespace.
     */
    name: string;
    /** The namespace the type lives in. A `using` for it is registered on the file builder when the reference is written. */
    namespace?: Nullable<string>;
    generics?: Nullable<Nullable<CsType<TBuilder>>[]>;
    /** Appends `?` to the type. */
    nullable?: Nullable<boolean>;
    /** Makes this reference an array of the given element type (`T[]`). Use `csReference.array` to create one. */
    arrayOf?: Nullable<CsType<TBuilder>>;
  }
>;

type _AddUsingHandler<T> = {
  builderClass: abstract new (...args: any) => T;
  handler: (builder: T, reference: CsReference<any>) => void;
};

export class CsReference<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  private static readonly addUsingHandlers: _AddUsingHandler<any>[] = [
    {
      builderClass: CSharpFileBuilder,
      handler: (builder, reference) => builder.addUsing(reference.namespace ?? undefined),
    },
  ];

  public name: string;
  public namespace: string | null;
  public generics: CsType<TBuilder>[];
  public nullable: boolean;
  public arrayOf: CsType<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.namespace = options.namespace ?? null;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.nullable = options.nullable ?? false;
    this.arrayOf = options.arrayOf ?? null;
  }

  public addUsing(builder: TBuilder): void {
    if (this.namespace) {
      const handler = CsReference.addUsingHandlers.find((h) => builder instanceof h.builderClass);
      if (handler) {
        handler.handler(builder, this);
      }
    }
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.arrayOf) {
      writeCsNode(builder, this.arrayOf);
      builder.append('[]');
    } else {
      builder.append(this.name);
      writeCsGenericParameters(builder, this.generics);
    }
    if (this.nullable) {
      builder.append('?');
    }

    this.addUsing(builder);
  }

  public static registerAddUsingHandler<TBuilder extends SourceBuilder>(
    builderClass: _AddUsingHandler<TBuilder>['builderClass'],
    handler: _AddUsingHandler<TBuilder>['handler'],
  ): void {
    CsReference.addUsingHandlers.push({ builderClass, handler });
  }
}

const createReference = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  namespace?: Options<TBuilder>['namespace'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'namespace'>>,
): CsReference<TBuilder> => new CsReference<TBuilder>({ ...options, name, namespace });

const createArrayReference = <TBuilder extends SourceBuilder>(
  elementType: CsType<TBuilder>,
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'namespace' | 'generics' | 'arrayOf'>>,
): CsReference<TBuilder> => {
  const elementName =
    elementType instanceof CsReference ? elementType.name : typeof elementType === 'string' ? elementType : 'array';
  return new CsReference<TBuilder>({ ...options, name: `${elementName}[]`, arrayOf: elementType });
};

export type CsReferenceFactory = (<TBuilder extends SourceBuilder>(
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'namespace'>>,
) => CsReference<TBuilder>) & {
  refName: string;
  namespace: Nullable<string>;
  matches: (value: unknown) => value is CsReference<never>;
};

export type CsGenericReferenceFactory<TGenericCount extends number | number[]> = (<TBuilder extends SourceBuilder>(
  generics: TupleWithCount<CsType<TBuilder>, TGenericCount>,
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'namespace' | 'generics'>>,
) => CsReference<TBuilder>) & {
  refName: string;
  namespace: Nullable<string>;
  infer: <TBuilder extends SourceBuilder>(
    options?: Prettify<Omit<Options<TBuilder>, 'name' | 'namespace' | 'generics'>>,
  ) => CsReference<TBuilder>;
  matches: (value: unknown) => value is CsReference<never>;
};

const createFactory = (name: string, namespace?: Nullable<string>): CsReferenceFactory => {
  return Object.assign(
    <TBuilder extends SourceBuilder>(options?: Prettify<Omit<Options<TBuilder>, 'name' | 'namespace'>>) =>
      createReference<TBuilder>(name, namespace, options),
    {
      refName: name,
      namespace,
      matches: (value: unknown): value is CsReference<never> =>
        value instanceof CsReference && value.name === name && value.namespace === (namespace ?? null),
    },
  );
};

const createGenericFactory = <TGenericCount extends number | number[]>(
  name: string,
  namespace?: Nullable<string>,
): CsGenericReferenceFactory<TGenericCount> => {
  return Object.assign(
    <TBuilder extends SourceBuilder>(
      generics: TupleWithCount<CsType<TBuilder>, TGenericCount>,
      options?: Prettify<Omit<Options<TBuilder>, 'name' | 'namespace' | 'generics'>>,
    ) => createReference<TBuilder>(name, namespace, { ...options, generics }),
    {
      refName: name,
      namespace,
      infer: <TBuilder extends SourceBuilder>(
        options?: Prettify<Omit<Options<TBuilder>, 'name' | 'namespace' | 'generics'>>,
      ) => createReference<TBuilder>(name, namespace, options),
      matches: (value: unknown): value is CsReference<never> =>
        value instanceof CsReference && value.name === name && value.namespace === (namespace ?? null),
    },
  );
};

const usingRefs = <TBuilder extends SourceBuilder>(builder: TBuilder, references: CsReference<TBuilder>[]): void => {
  references.forEach((ref) => ref.addUsing(builder));
};

export const csReference: typeof createReference & {
  factory: typeof createFactory;
  genericFactory: typeof createGenericFactory;
  array: typeof createArrayReference;
  write: typeof writeCsNodes;
  using: typeof usingRefs;
} = Object.assign(createReference, {
  factory: createFactory,
  genericFactory: createGenericFactory,
  array: createArrayReference,
  write: writeCsNodes,
  using: usingRefs,
});
