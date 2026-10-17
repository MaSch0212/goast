import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { CsNode } from '../node.ts';
import { writeCsAttributes } from '../utils/write-cs-attributes.ts';
import { writeCsNode } from '../utils/write-cs-node.ts';
import type { CsAttribute } from './attribute.ts';
import type { CsDoc } from './doc.ts';
import type { CsValue } from './types.ts';

type Injects = 'doc' | 'attributes' | 'name' | 'value';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    doc?: Nullable<CsDoc<TBuilder>>;
    attributes?: Nullable<Nullable<CsAttribute<TBuilder>>[]>;
    /** The explicit value of the member (`Name = 1`). */
    value?: Nullable<CsValue<TBuilder>>;
  }
>;

export class CsEnumMember<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public doc: CsDoc<TBuilder> | null;
  public attributes: CsAttribute<TBuilder>[];
  public value: CsValue<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.attributes = options.attributes?.filter(notNullish) ?? [];
    this.value = options.value ?? null;
  }

  /** Writes the member without a trailing separator. */
  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    this.doc?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAttributes);
    writeCsAttributes(builder, this.attributes, { multiline: true });
    builder.append(this.inject.afterAttributes);

    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    if (this.value !== null) {
      builder.append(' = ', this.inject.beforeValue);
      writeCsNode(builder, this.value);
      builder.append(this.inject.afterValue);
    }
  }
}

/** Writes enum members separated by commas. Members with documentation or attributes are separated by blank lines. */
const writeEnumMembers = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  members: Nullable<CsEnumMember<TBuilder>>[],
): void => {
  const filtered = members.filter(notNullish);
  const spacing = filtered.some((m) => m.doc || m.attributes.length > 0);
  builder.forEach(
    filtered,
    (b, m, i) => b.if(spacing && i > 0, (b) => b.ensurePreviousLineEmpty()).append((b) => m.write(b)),
    { separator: ',\n' },
  );
};

const createEnumMember = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): CsEnumMember<TBuilder> => new CsEnumMember<TBuilder>({ ...options, name });

export const csEnumMember: typeof createEnumMember & { write: typeof writeEnumMembers } = Object.assign(
  createEnumMember,
  {
    write: writeEnumMembers,
  },
);
