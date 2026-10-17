import { type AppendValue, isAppendValue, notNullish, type Nullable, type SourceBuilder } from '@goast/core';

import type { TsNode } from '../node.ts';
import { tsDoc } from '../nodes/doc.ts';
import { TsMethod } from '../nodes/method.ts';
import { TsProperty } from '../nodes/property.ts';
import { writeTsNode } from './write-ts-nodes.ts';

/**
 * Writes class or interface members to a builder, separating them with blank lines where needed.
 * A compact member is a property or a bodyless method without a doc comment or decorators, or a plain appended value.
 * Any other member gets a blank line before it, unless it is the first member and `alreadyHasMembers` is not set,
 * and a blank line after it, unless it is the last member. Compact members get no blank lines of their own, but a
 * line break is ensured after each one, so consecutive compact members are written on consecutive lines.
 * @template TBuilder The type of the source builder the members are written to.
 * @param builder The builder to write to.
 * @param members The members to write. Nullish entries are skipped.
 * @param options Options for writing the members. Set `alreadyHasMembers` when the members follow other content
 *   in the same body, so that the first member also gets a blank line before it.
 */
export function writeTsMembers<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  members: Nullable<AppendValue<TBuilder> | TsNode<TBuilder>>[],
  options?: { alreadyHasMembers?: boolean },
): void {
  const filteredMembers = members.filter(notNullish);
  builder.forEach(filteredMembers, (b, m, i) =>
    b.if(
      () =>
        !(m instanceof TsProperty && tsDoc.isEmpty(m.doc) && m.decorators.length === 0) &&
        !(m instanceof TsMethod && !m.body && tsDoc.isEmpty(m.doc) && m.decorators.length === 0) &&
        !isAppendValue(m),
      (b) =>
        b
          .if(i > 0 || !!options?.alreadyHasMembers, (b) => b.ensurePreviousLineEmpty())
          .append((b) => writeTsNode(b, m))
          .if(i < filteredMembers.length - 1, (b) => b.ensurePreviousLineEmpty()),
      (b) => b.append((b) => writeTsNode(b, m)).ensureCurrentLineEmpty(),
    ),
  );
}
