import type { AllOfInheritanceDiscriminatorChildA } from './all-of-inheritance-discriminator-child-a';
import type { AllOfInheritanceDiscriminatorChildB } from './all-of-inheritance-discriminator-child-b';

type AllOfInheritanceDiscriminatorDiscriminator = ('AllOfInheritanceDiscriminatorChildA') | ('AllOfInheritanceDiscriminatorChildB');

export type _AllOfInheritanceDiscriminatorBase = {
    kind: string;
  };

export type AllOfInheritanceDiscriminator<TKind extends AllOfInheritanceDiscriminatorDiscriminator = AllOfInheritanceDiscriminatorDiscriminator> = (_AllOfInheritanceDiscriminatorBase) & (({
        AllOfInheritanceDiscriminatorChildA: ({
            kind: 'AllOfInheritanceDiscriminatorChildA';
          }) & (AllOfInheritanceDiscriminatorChildA);
        AllOfInheritanceDiscriminatorChildB: ({
            kind: 'AllOfInheritanceDiscriminatorChildB';
          }) & (AllOfInheritanceDiscriminatorChildB);
      })[TKind]);
