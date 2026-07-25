import type { _ImplicitBaseBase } from './implicit-base';

export type ImplicitDog = (Omit<(_ImplicitBaseBase) & ({
          breed?: string;
        }), 'petType'>) & ({
      petType: 'ImplicitDog';
    });
