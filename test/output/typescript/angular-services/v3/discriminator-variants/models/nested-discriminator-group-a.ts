import type { _NestedDiscriminatorGroupBase } from './nested-discriminator-group';

export type NestedDiscriminatorGroupA = (Omit<(_NestedDiscriminatorGroupBase) & ({
          groupAValue?: string;
        }), 'groupKind'>) & ({
      groupKind: 'NestedDiscriminatorGroupA';
    });
