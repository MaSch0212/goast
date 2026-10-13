import type { _DiscriminatorPropertyNotRequiredBase } from './discriminator-property-not-required';

export type DiscriminatorPropertyNotRequiredB = (Omit<(_DiscriminatorPropertyNotRequiredBase) & ({
          bValue?: string;
        }), 'kind'>) & ({
      kind: 'DiscriminatorPropertyNotRequiredB';
    });
