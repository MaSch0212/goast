import type { _PartialMappingBase } from './partial-mapping';

export type PartialMappingThird = (Omit<(_PartialMappingBase) & ({
          thirdValue?: string;
        }), 'kind'>) & ({
      kind: 'PartialMappingThird';
    });
