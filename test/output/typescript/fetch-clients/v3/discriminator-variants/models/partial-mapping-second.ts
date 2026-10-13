import type { _PartialMappingBase } from './partial-mapping';

export type PartialMappingSecond = (Omit<(_PartialMappingBase) & ({
          secondValue?: string;
        }), 'kind'>) & ({
      kind: 'second';
    });
