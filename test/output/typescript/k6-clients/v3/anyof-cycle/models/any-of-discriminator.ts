import type { AnyOfDiscriminatorA } from './any-of-discriminator-a';
import type { AnyOfDiscriminatorB } from './any-of-discriminator-b';

type AnyOfDiscriminatorDiscriminator = ('AnyOfDiscriminatorB') | ('AnyOfDiscriminatorA');

export type _AnyOfDiscriminatorBase = ({
      kind: string;
    }) & (Partial<AnyOfDiscriminatorA>) & (Partial<AnyOfDiscriminatorB>);

export type AnyOfDiscriminator<TKind extends AnyOfDiscriminatorDiscriminator = AnyOfDiscriminatorDiscriminator> = (_AnyOfDiscriminatorBase) & (({
        AnyOfDiscriminatorB: ({
            kind: 'AnyOfDiscriminatorB';
          }) & (AnyOfDiscriminatorB);
        AnyOfDiscriminatorA: ({
            kind: 'AnyOfDiscriminatorA';
          }) & (AnyOfDiscriminatorA);
      })[TKind]);
