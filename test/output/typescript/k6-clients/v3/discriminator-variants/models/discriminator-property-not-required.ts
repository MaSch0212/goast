import type { DiscriminatorPropertyNotRequiredA } from './discriminator-property-not-required-a';
import type { DiscriminatorPropertyNotRequiredB } from './discriminator-property-not-required-b';

type DiscriminatorPropertyNotRequiredDiscriminator = ('DiscriminatorPropertyNotRequiredB') | ('DiscriminatorPropertyNotRequiredA');

export type _DiscriminatorPropertyNotRequiredBase = (DiscriminatorPropertyNotRequiredA) | (DiscriminatorPropertyNotRequiredB);

export type DiscriminatorPropertyNotRequired<TKind extends DiscriminatorPropertyNotRequiredDiscriminator = DiscriminatorPropertyNotRequiredDiscriminator> = (_DiscriminatorPropertyNotRequiredBase) & (({
        DiscriminatorPropertyNotRequiredB: ({
            kind: 'DiscriminatorPropertyNotRequiredB';
          }) & (DiscriminatorPropertyNotRequiredB);
        DiscriminatorPropertyNotRequiredA: ({
            kind: 'DiscriminatorPropertyNotRequiredA';
          }) & (DiscriminatorPropertyNotRequiredA);
      })[TKind]);
