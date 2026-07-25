import type { _PetBase } from './pet';
import type { Schema9 } from './schema-9';

export type Cat = (Omit<(_PetBase) & ({
          /**
           * The measured skill for hunting
           */
          huntingSkill: Schema9;
        }), 'petType'>) & ({
      petType: 'cat';
    });
