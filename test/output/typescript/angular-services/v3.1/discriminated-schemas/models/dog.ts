import type { _PetBase } from './pet';

export type Dog = (Omit<(_PetBase) & ({
          /**
           * the size of the pack the dog is from
           */
          packSize: number;
        }), 'petType'>) & ({
      petType: 'dog';
    });
