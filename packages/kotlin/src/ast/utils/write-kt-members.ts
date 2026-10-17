import { isAppendValue, isAppendValueGroup, notNullish, type Nullable, type SourceBuilder } from '@goast/core';

import { KtProperty } from '../nodes/property.ts';
import { type KtAppendValue, writeKtNode } from './write-kt-node.ts';

/**
 * Writes class members, separating them with blank lines where needed.
 *
 * Each member is either compact or a block. A compact member is a `KtProperty` without a doc comment and without
 * annotations, or a plain append value such as a string. All other members are blocks. The rules are:
 * - A block member is preceded by a blank line, except when it is the first member and `alreadyHasMembers` is not set.
 * - A block member is followed by a blank line, except when it is the last member.
 * - A compact member is written on its own line and followed by a line break. No blank line is added before or after
 *   it, so consecutive compact members are written on consecutive lines.
 *
 * @template TBuilder The type of the source builder the members are written to.
 * @param builder The builder to write to.
 * @param members The members in the order they are written. Nullish entries are ignored.
 * @param options Options for writing. Set `alreadyHasMembers` when other members precede these, so that a first block
 * member also gets a blank line before it.
 */
export function writeKtMembers<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  members: Nullable<KtAppendValue<TBuilder>>[],
  options?: { alreadyHasMembers?: boolean },
): void {
  const filteredMembers = members.filter(notNullish);
  builder.forEach(filteredMembers, (b, m, i) =>
    b.if(
      () =>
        !(m instanceof KtProperty && !m.doc && m.annotations.length === 0) &&
        !isAppendValue(m) &&
        !isAppendValueGroup(m),
      (b) =>
        b
          .if(i > 0 || !!options?.alreadyHasMembers, (b) => b.ensurePreviousLineEmpty())
          .append((b) => writeKtNode(b, m))
          .if(i < filteredMembers.length - 1, (b) => b.ensurePreviousLineEmpty()),
      (b) => b.append((b) => writeKtNode(b, m)).ensureCurrentLineEmpty(),
    ),
  );
}
