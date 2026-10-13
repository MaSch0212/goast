import type { DiscriminatorWithEnumAlpha } from './discriminator-with-enum-alpha';
import type { DiscriminatorWithEnumBeta } from './discriminator-with-enum-beta';

type DiscriminatorWithEnumDiscriminator = ('alpha') | ('beta');

export type _DiscriminatorWithEnumBase = (DiscriminatorWithEnumAlpha) | (DiscriminatorWithEnumBeta);

export type DiscriminatorWithEnum<TKind extends DiscriminatorWithEnumDiscriminator = DiscriminatorWithEnumDiscriminator> = (_DiscriminatorWithEnumBase) & (({
        alpha: ({
            kind: 'alpha';
          }) & (DiscriminatorWithEnumAlpha);
        beta: ({
            kind: 'beta';
          }) & (DiscriminatorWithEnumBeta);
      })[TKind]);
