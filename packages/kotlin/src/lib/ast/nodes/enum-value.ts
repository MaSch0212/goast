import {
  AppendValue,
  AstNodeOptions,
  Nullable,
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
import { KtNode } from '../node';
import { writeKt, writeKtMembers } from '../utils';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    doc?: Nullable<KtDoc<TBuilder>>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    arguments?: Nullable<Nullable<KtArgument<TBuilder> | AppendValue<TBuilder>>[]>;
    members?: Nullable<Nullable<Member<TBuilder>>[]>;
  }
>;

type Member<TBuilder extends SourceBuilder> = KtParameter<TBuilder> | KtFunction<TBuilder> | AppendValue<TBuilder>;

export class KtEnumValue<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public doc: KtDoc<TBuilder> | null;
  public annotations: KtAnnotation<TBuilder>[];
  public arguments: (KtArgument<TBuilder> | AppendValue<TBuilder>)[];
  public members: Member<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.arguments = options.arguments?.filter(notNullish) ?? [];
    this.members = options.members?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .append((b) => this.doc?.write(b))
      .append((b) => ktAnnotation.write(b, this.annotations, { multiline: true }))
      .append(this.name)
      .appendIf(this.arguments.length > 0, (b) => ktArgument.write(b, this.arguments))
      .appendIf(this.members.some(notNullish), (b) =>
        b.append(' ').parenthesize('{}', (b) => writeKtMembers(b, this.members), { multiline: true }),
      );
  }
}

const createEnumValue = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
) => new KtEnumValue<TBuilder>({ ...options, name });

const writeEnumValues = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtEnumValue<TBuilder> | AppendValue<TBuilder>>>,
) => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  const spacing = filteredNodes.some(
    (v) => v instanceof KtEnumValue && (v.annotations.length > 0 || v.doc || v.members.some(notNullish)),
  );
  const multiline =
    spacing ||
    filteredNodes.length > 4 ||
    filteredNodes.some((v) => v instanceof KtEnumValue && v.arguments.length > 0);
  builder.forEach(
    filteredNodes,
    (b, v, i) => b.if(spacing && i > 0, (b) => b.ensurePreviousLineEmpty()).append((b) => writeKt(b, v)),
    { separator: multiline ? ',\n' : ', ' },
  );
};

export const ktEnumValue = Object.assign(createEnumValue, {
  write: writeEnumValues,
});
