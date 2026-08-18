import type { _PartialMappingBase } from './partial-mapping';

export type PartialMappingFirst = (Omit<(_PartialMappingBase) & ({
          firstValue?: string;
        }), 'kind'>) & ({
      kind: 'first';
    });
