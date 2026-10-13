import type { _AnyOfDiscriminatorBase } from './any-of-discriminator';

export type AnyOfDiscriminatorB = (Omit<(_AnyOfDiscriminatorBase) & ({
          bValue?: string;
        }), 'kind'>) & ({
      kind: 'AnyOfDiscriminatorB';
    });
