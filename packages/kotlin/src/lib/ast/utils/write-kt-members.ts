import { SourceBuilder, Nullable, notNullish, isAppendValue, isAppendValueGroup } from '@goast/core';

import { KtAppendValue, writeKtNode } from './write-kt-node';
import { KtProperty } from '../nodes/property';

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
