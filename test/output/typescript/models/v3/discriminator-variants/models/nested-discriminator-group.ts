import type { _NestedDiscriminatorBase } from './nested-discriminator';
import type { _Schema84Base } from './schema-84';

export type NestedDiscriminatorGroup = (Omit<(_NestedDiscriminatorBase) & (_Schema84Base), 'kind'>) & ({
      kind: 'NestedDiscriminatorGroup';
    });
