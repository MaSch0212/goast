import { isAppendValue, isAppendValueGroup, notNullish, type Nullable, type SourceBuilder } from '@goast/core';

import { CsField } from '../nodes/field.ts';
import { CsProperty } from '../nodes/property.ts';
import { type CsAppendValue, writeCsNode } from './write-cs-node.ts';

/**
 * Writes type members separated by blank lines. Consecutive properties/fields without documentation or attributes are
 * kept together, and plain text members (e.g. comments) never get blank lines around them.
 */
export function writeCsMembers<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  members: Nullable<CsAppendValue<TBuilder>>[],
  options?: { alreadyHasMembers?: boolean },
): void {
  const filteredMembers = members.filter(notNullish);
  builder.forEach(filteredMembers, (b, m, i) =>
    b.if(
      () =>
        !((m instanceof CsProperty || m instanceof CsField) && !m.doc && m.attributes.length === 0) &&
        !isAppendValue(m) &&
        !isAppendValueGroup(m),
      (b) =>
        b
          .if(i > 0 || !!options?.alreadyHasMembers, (b) => b.ensurePreviousLineEmpty())
          .append((b) => writeCsNode(b, m))
          .if(i < filteredMembers.length - 1, (b) => b.ensurePreviousLineEmpty()),
      (b) => b.append((b) => writeCsNode(b, m)).ensureCurrentLineEmpty(),
    ),
  );
}
