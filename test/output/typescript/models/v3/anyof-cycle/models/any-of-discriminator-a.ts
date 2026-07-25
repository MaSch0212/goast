import type { _AnyOfDiscriminatorBase } from './any-of-discriminator';

export type AnyOfDiscriminatorA = (Omit<(_AnyOfDiscriminatorBase) & ({
          aValue?: string;
        }), 'kind'>) & ({
      kind: 'AnyOfDiscriminatorA';
    });
