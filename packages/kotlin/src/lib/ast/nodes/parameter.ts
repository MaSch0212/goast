import { SourceBuilder, AppendValue, AstNodeOptions, Prettify, SingleOrMultiple, toArray } from '@goast/core';

import { ktAnnotation } from './annotation';
import { KotlinFileBuilder } from '../../file-builder';
import { KtAccessModifier } from '../common';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type KtParameterOptions<TBuilder extends SourceBuilder> = AstNodeOptions<
  KtParameter<TBuilder>,
  typeof KtNode<TBuilder>,
  'name' | 'type'
>;

export class KtParameter<
  TBuilder extends SourceBuilder = KotlinFileBuilder,
  TInjects extends string = never
> extends KtNode<TBuilder, TInjects> {
  public name: string;
  public type: AppendValue<TBuilder>;
  public annotations: AppendValue<TBuilder>[];
  public default: AppendValue<TBuilder>;
  public vararg: boolean;
  public description: AppendValue<TBuilder>;

  // class parameter options
  public accessModifier: KtAccessModifier;
  public property: 'readonly' | 'mutable' | null;
  public propertyDescription: AppendValue<TBuilder>;
  public override: boolean;

  constructor(options: KtParameterOptions<TBuilder>) {
    super(options);
    this.name = options.name;
    this.type = options.type;
    this.annotations = options.annotations ?? [];
    this.default = options.default;
    this.vararg = options.vararg ?? false;
    this.description = options.description ?? null;

    this.accessModifier = options.accessModifier ?? null;
    this.property = options.property ?? null;
    this.propertyDescription = options.propertyDescription;
    this.override = options.override ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .append((b) => ktAnnotation.write(b, this.annotations, { multiline: true }))
      .appendIf(!!this.accessModifier && !!this.property, this.accessModifier, ' ')
      .appendIf(!!this.override, 'override ')
      .appendIf(this.vararg, 'vararg ')
      .appendIf(!!this.property, this.property === 'mutable' ? 'var' : 'val', ' ')
      .append(this.name, ': ', this.type)
      .appendIf(!!this.default, ' = ', this.default);
  }
}

const createParameter = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  name: KtParameter<TBuilder>['name'],
  type: KtParameter<TBuilder>['type'],
  options?: Prettify<
    Omit<
      KtParameterOptions<TBuilder>,
      'name' | 'type' | 'accessModifier' | 'property' | 'propertyDescription' | 'override'
    >
  >
) => new KtParameter<TBuilder>({ ...options, name, type });

const createClassParameter = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  name: KtParameter<TBuilder>['name'],
  type: KtParameter<TBuilder>['type'],
  options?: Prettify<Omit<KtParameterOptions<TBuilder>, 'name' | 'type'>>
) => new KtParameter<TBuilder>({ ...options, name, type });

const writeKtParameters = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  builder: TBuilder,
  parameters: SingleOrMultiple<KtParameter<TBuilder> | AppendValue<TBuilder>>
) => {
  parameters = toArray(parameters);
  const multiline =
    parameters.length > 2 || parameters.some((p) => p instanceof KtParameter && p.annotations.length > 0);
  const spacing = multiline && parameters.some((p) => p instanceof KtParameter && p.annotations.length > 0);
  builder.parenthesize(
    '()',
    (b) =>
      b.forEach(
        parameters,
        (b, p, i) => b.if(i > 0 && spacing, (b) => b.ensurePreviousLineEmpty()).append((b) => writeKt(b, p)),
        { separator: multiline ? ',\n' : ', ' }
      ),
    { multiline }
  );
};

export const ktParameter = Object.assign(createParameter, {
  class: createClassParameter,
  write: writeKtParameters,
});
