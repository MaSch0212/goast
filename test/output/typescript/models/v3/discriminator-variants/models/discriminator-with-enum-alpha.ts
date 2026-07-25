import type { _DiscriminatorWithEnumBase } from './discriminator-with-enum';

export type DiscriminatorWithEnumAlpha = (Omit<(_DiscriminatorWithEnumBase) & ({
          alphaValue?: string;
        }), 'kind'>) & ({
      kind: 'alpha';
    });
