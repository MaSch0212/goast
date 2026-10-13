import type { _ImplicitBaseBase } from './implicit-base';

export type ImplicitCat = (Omit<(_ImplicitBaseBase) & ({
          lives?: number;
        }), 'petType'>) & ({
      petType: 'ImplicitCat';
    });
