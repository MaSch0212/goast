import type { _AllOfInheritanceDiscriminatorBase } from './all-of-inheritance-discriminator';

export type AllOfInheritanceDiscriminatorChildA = (Omit<(_AllOfInheritanceDiscriminatorBase) & ({
          childAValue?: string;
        }), 'kind'>) & ({
      kind: 'AllOfInheritanceDiscriminatorChildA';
    });
