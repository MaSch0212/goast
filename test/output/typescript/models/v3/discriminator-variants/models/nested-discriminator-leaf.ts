import type { _NestedDiscriminatorBase } from './nested-discriminator';

export type NestedDiscriminatorLeaf = (Omit<(_NestedDiscriminatorBase) & ({
          leafValue?: string;
        }), 'kind'>) & ({
      kind: 'NestedDiscriminatorLeaf';
    });
