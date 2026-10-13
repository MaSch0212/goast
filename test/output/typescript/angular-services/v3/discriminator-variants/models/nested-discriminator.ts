import type { NestedDiscriminatorGroup } from './nested-discriminator-group';
import type { NestedDiscriminatorLeaf } from './nested-discriminator-leaf';

type NestedDiscriminatorDiscriminator = 'NestedDiscriminatorLeaf';

export type _NestedDiscriminatorBase = (NestedDiscriminatorLeaf) | (NestedDiscriminatorGroup);

export type NestedDiscriminator<TKind extends NestedDiscriminatorDiscriminator = NestedDiscriminatorDiscriminator> = (_NestedDiscriminatorBase) & (({
        NestedDiscriminatorLeaf: ({
            kind: 'NestedDiscriminatorLeaf';
          }) & (NestedDiscriminatorLeaf);
      })[TKind]);
