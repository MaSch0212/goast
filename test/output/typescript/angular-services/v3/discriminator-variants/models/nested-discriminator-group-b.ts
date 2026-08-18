import type { _NestedDiscriminatorGroupBase } from './nested-discriminator-group';

export type NestedDiscriminatorGroupB = (Omit<(_NestedDiscriminatorGroupBase) & ({
          groupBValue?: string;
        }), 'groupKind'>) & ({
      groupKind: 'NestedDiscriminatorGroupB';
    });
