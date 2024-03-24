import {
  SourceBuilder,
  AppendValue,
  AstNodeOptions,
  Prettify,
  SingleOrMultiple,
  toArray,
  notNullish,
  Nullable,
} from '@goast/core';

import { ktAnnotation } from './annotation';
import { KtReference } from './reference';
import { KtAccessModifier } from '../common';
import { KtNode } from '../node';
import { writeKt } from '../utils';
type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    type: AppendValue<TBuilder> | KtReference<TBuilder>;
    annotations?: Nullable<Nullable<AppendValue<TBuilder>>[]>;
    default?: Nullable<AppendValue<TBuilder>>;
    vararg?: Nullable<boolean>;
    description?: Nullable<AppendValue<TBuilder>>;

    // class parameter options
    accessModifier?: Nullable<KtAccessModifier>;
    property?: Nullable<'readonly' | 'mutable'>;
    propertyDescription?: Nullable<AppendValue<TBuilder>>;
    override?: Nullable<boolean>;
  }
>;

export class KtParameter<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public type: AppendValue<TBuilder> | KtReference<TBuilder>;
  public annotations: AppendValue<TBuilder>[];
  public default: AppendValue<TBuilder> | null;
  public vararg: boolean;
  public description: AppendValue<TBuilder> | null;

  // class parameter options
  public accessModifier: KtAccessModifier | null;
  public property: 'readonly' | 'mutable' | null;
  public propertyDescription: AppendValue<TBuilder> | null;
  public override: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.type = options.type;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.default = options.default ?? null;
    this.vararg = options.vararg ?? false;
    this.description = options.description ?? null;

    this.accessModifier = options.accessModifier ?? null;
    this.property = options.property ?? null;
    this.propertyDescription = options.propertyDescription ?? null;
    this.override = options.override ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .append((b) => ktAnnotation.write(b, this.annotations, { multiline: true }))
      .appendIf(!!this.accessModifier && !!this.property, this.accessModifier, ' ')
      .appendIf(!!this.override, 'override ')
      .appendIf(this.vararg, 'vararg ')
      .appendIf(!!this.property, this.property === 'mutable' ? 'var' : 'val', ' ')
      .append(this.name, ': ', (b) => writeKt(b, this.type))
      .appendIf(!!this.default, ' = ', this.default);
  }
}

const createParameter = <TBuilder extends SourceBuilder>(
  name: KtParameter<TBuilder>['name'],
  type: KtParameter<TBuilder>['type'],
  options?: Prettify<
    Omit<Options<TBuilder>, 'name' | 'type' | 'accessModifier' | 'property' | 'propertyDescription' | 'override'>
  >,
) => new KtParameter<TBuilder>({ ...options, name, type });

const createClassParameter = <TBuilder extends SourceBuilder>(
  name: KtParameter<TBuilder>['name'],
  type: KtParameter<TBuilder>['type'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'type'>>,
) => new KtParameter<TBuilder>({ ...options, name, type });

const writeKtParameters = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtParameter<TBuilder> | AppendValue<TBuilder>>>,
) => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  const multiline =
    filteredNodes.length > 2 || filteredNodes.some((p) => p instanceof KtParameter && p.annotations.length > 0);
  const spacing = multiline && filteredNodes.some((p) => p instanceof KtParameter && p.annotations.length > 0);
  builder.parenthesize(
    '()',
    (b) =>
      b.forEach(
        filteredNodes,
        (b, p, i) => b.if(i > 0 && spacing, (b) => b.ensurePreviousLineEmpty()).append((b) => writeKt(b, p)),
        { separator: multiline ? ',\n' : ', ' },
      ),
    { multiline },
  );
};

export const ktParameter = Object.assign(createParameter, {
  class: createClassParameter,
  write: writeKtParameters,
});
