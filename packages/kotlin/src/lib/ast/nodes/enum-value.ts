import { AppendValue, AstNodeOptions, Nullable, Prettify, SourceBuilder, notNullish } from '@goast/core';

import { ktAnnotation, KtAnnotation } from './annotation';
import { ktArgument, KtArgument } from './argument';
import { KtDoc } from './doc';
import { KtFunction } from './function';
import { KtParameter } from './parameter';
import { KtNode } from '../node';
import { writeKtEnumValues } from '../utils/write-kt-enum-values';
import { writeKtMembers } from '../utils/write-kt-members';

type Injects = 'doc' | 'annotations' | 'name' | 'arguments' | 'body' | 'members';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    doc?: Nullable<KtDoc<TBuilder>>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    arguments?: Nullable<Nullable<KtArgument<TBuilder> | AppendValue<TBuilder>>[]>;
    members?: Nullable<Nullable<KtEnumValueMember<TBuilder>>[]>;
  }
>;

export type KtEnumValueMember<TBuilder extends SourceBuilder> =
  | KtParameter<TBuilder>
  | KtFunction<TBuilder>
  | AppendValue<TBuilder>;

export class KtEnumValue<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public doc: KtDoc<TBuilder> | null;
  public annotations: KtAnnotation<TBuilder>[];
  public arguments: (KtArgument<TBuilder> | AppendValue<TBuilder>)[];
  public members: KtEnumValueMember<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.arguments = options.arguments?.filter(notNullish) ?? [];
    this.members = options.members?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    this.doc?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations, { multiline: true });
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    if (this.arguments.length > 0) {
      builder.append(this.inject.beforeArguments);
      ktArgument.write(builder, this.arguments);
      builder.append(this.inject.afterArguments);
    }

    if (this.members.length > 0) {
      builder.append(' ');
      builder.append(this.inject.beforeBody);
      builder.parenthesize(
        '{}',
        (b) => {
          builder.append(this.inject.beforeMembers);
          writeKtMembers(b, this.members);
          builder.append(this.inject.afterMembers);
        },
        { multiline: true },
      );
      builder.append(this.inject.afterBody);
    }
  }
}

const createEnumValue = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
) => new KtEnumValue<TBuilder>({ ...options, name });

export const ktEnumValue = Object.assign(createEnumValue, {
  write: writeKtEnumValues,
});
