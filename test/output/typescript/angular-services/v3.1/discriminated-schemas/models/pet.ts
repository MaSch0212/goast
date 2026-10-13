import type { Cat } from './cat';
import type { Dog } from './dog';

type PetDiscriminator = ('dog') | ('cat');

export type _PetBase = {
    name: string;
    petType: string;
  };

export type Pet<TPetType extends PetDiscriminator = PetDiscriminator> = (_PetBase) & (({
        dog: ({
            petType: 'dog';
          }) & (Dog);
        cat: ({
            petType: 'cat';
          }) & (Cat);
      })[TPetType]);
