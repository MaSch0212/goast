import type { _AllOfInheritanceDiscriminatorBase } from './all-of-inheritance-discriminator';

export type AllOfInheritanceDiscriminatorChildB = (Omit<(_AllOfInheritanceDiscriminatorBase) & ({
          childBValue?: string;
        }), 'kind'>) & ({
      kind: 'AllOfInheritanceDiscriminatorChildB';
    });
