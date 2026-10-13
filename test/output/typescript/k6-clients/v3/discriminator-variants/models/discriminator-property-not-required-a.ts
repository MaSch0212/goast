import type { _DiscriminatorPropertyNotRequiredBase } from './discriminator-property-not-required';

export type DiscriminatorPropertyNotRequiredA = (Omit<(_DiscriminatorPropertyNotRequiredBase) & ({
          aValue?: string;
        }), 'kind'>) & ({
      kind: 'DiscriminatorPropertyNotRequiredA';
    });
