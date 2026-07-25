import type { _DiscriminatorWithEnumBase } from './discriminator-with-enum';

export type DiscriminatorWithEnumBeta = (Omit<(_DiscriminatorWithEnumBase) & ({
          betaValue?: string;
        }), 'kind'>) & ({
      kind: 'beta';
    });
