import type { NestedDiscriminatorGroupA } from './nested-discriminator-group-a';
import type { NestedDiscriminatorGroupB } from './nested-discriminator-group-b';

type NestedDiscriminatorGroupDiscriminator = ('NestedDiscriminatorGroupB') | ('NestedDiscriminatorGroupA');

export type _NestedDiscriminatorGroupBase = (NestedDiscriminatorGroupA) | (NestedDiscriminatorGroupB);

export type NestedDiscriminatorGroup<TGroupKind extends NestedDiscriminatorGroupDiscriminator = NestedDiscriminatorGroupDiscriminator> = (_NestedDiscriminatorGroupBase) & (({
        NestedDiscriminatorGroupB: ({
            groupKind: 'NestedDiscriminatorGroupB';
          }) & (NestedDiscriminatorGroupB);
        NestedDiscriminatorGroupA: ({
            groupKind: 'NestedDiscriminatorGroupA';
          }) & (NestedDiscriminatorGroupA);
      })[TGroupKind]);
