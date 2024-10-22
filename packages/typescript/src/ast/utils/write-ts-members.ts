import { type AppendValue, isAppendValue, notNullish, type Nullable, type SourceBuilder } from '@goast/core';

import type { TsNode } from '../node.ts';
import { tsDoc } from '../nodes/doc.ts';
import { TsMethod } from '../nodes/method.ts';
import { TsProperty } from '../nodes/property.ts';
import { writeTsNode } from './write-ts-nodes.ts';

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
    ));
}
