import type { NestedDiscriminatorGroup } from './nested-discriminator-group';
import type { NestedDiscriminatorLeaf } from './nested-discriminator-leaf';

type NestedDiscriminatorDiscriminator = ('NestedDiscriminatorGroup') | ('NestedDiscriminatorLeaf');

export type _NestedDiscriminatorBase = (NestedDiscriminatorLeaf) | (NestedDiscriminatorGroup);

export type NestedDiscriminator<TKind extends NestedDiscriminatorDiscriminator = NestedDiscriminatorDiscriminator> = (_NestedDiscriminatorBase) & (({
        NestedDiscriminatorGroup: ({
            kind: 'NestedDiscriminatorGroup';
          }) & (NestedDiscriminatorGroup);
        NestedDiscriminatorLeaf: ({
            kind: 'NestedDiscriminatorLeaf';
          }) & (NestedDiscriminatorLeaf);
      })[TKind]);
