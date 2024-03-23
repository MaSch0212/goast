import {
  AppendValue,
  AstNodeOptions,
  Prettify,
  SingleOrMultiple,
  SourceBuilder,
  notNullish,
  toArray,
} from '@goast/core';

import { ktAnnotation, KtAnnotation } from './annotation';
import { ktArgument, KtArgument } from './argument';
import { KtDoc } from './doc';
import { KtFunction } from './function';
import { KtParameter } from './parameter';
import { KotlinFileBuilder } from '../../file-builder';
import { KtNode } from '../node';
import { writeKt, writeKtMembers } from '../utils';

type KtEnumValueOptions<TBuilder extends SourceBuilder> = AstNodeOptions<
  KtEnumValue<TBuilder>,
  typeof KtNode<TBuilder>,
  'name'
>;

export class KtEnumValue<
  TBuilder extends SourceBuilder = KotlinFileBuilder,
  TInjects extends string = never
> extends KtNode<TBuilder, TInjects> {
  public name: string;
  public doc: KtDoc<TBuilder> | null;
  public annotations: KtAnnotation<TBuilder>[];
  public arguments: (KtArgument<TBuilder> | AppendValue<TBuilder>)[];
  public members: (KtParameter<TBuilder> | KtFunction<TBuilder> | AppendValue<TBuilder>)[];

  constructor(options: KtEnumValueOptions<TBuilder>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.annotations = options.annotations ?? [];
    this.arguments = options.arguments ?? [];
    this.members = options.members ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .append((b) => this.doc?.write(b))
      .append((b) => ktAnnotation.write(b, this.annotations, { multiline: true }))
      .append(this.name)
      .appendIf(this.arguments.length > 0, (b) => ktArgument.write(b, this.arguments))
      .appendIf(this.members.some(notNullish), (b) =>
        b.append(' ').parenthesize('{}', (b) => writeKtMembers(b, this.members), { multiline: true })
      );
  }
}

const createEnumValue = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  name: KtEnumValue<TBuilder>['name'],
  options?: Prettify<Omit<KtEnumValueOptions<TBuilder>, 'name'>>
) => new KtEnumValue<TBuilder>({ ...options, name });

const writeEnumValues = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<KtEnumValue<TBuilder> | AppendValue<TBuilder>>
) => {
  nodes = toArray(nodes);
  const spacing = nodes.some(
    (v) => v instanceof KtEnumValue && (v.annotations.length > 0 || v.doc || v.members.some(notNullish))
  );
  const multiline =
    spacing || nodes.length > 4 || nodes.some((v) => v instanceof KtEnumValue && v.arguments.length > 0);
  builder.forEach(
    nodes,
    (b, v, i) => b.if(spacing && i > 0, (b) => b.ensurePreviousLineEmpty()).append((b) => writeKt(b, v)),
    { separator: multiline ? ',\n' : ', ' }
  );
};

export const ktEnumValue = Object.assign(createEnumValue, {
  write: writeEnumValues,
});
