import type { ImplicitCat } from './implicit-cat';
import type { ImplicitDog } from './implicit-dog';

type ImplicitBaseDiscriminator = ('ImplicitCat') | ('ImplicitDog');

export type _ImplicitBaseBase = (ImplicitDog) | (ImplicitCat);

export type ImplicitBase<TPetType extends ImplicitBaseDiscriminator = ImplicitBaseDiscriminator> = (_ImplicitBaseBase) & (({
        ImplicitCat: ({
            petType: 'ImplicitCat';
          }) & (ImplicitCat);
        ImplicitDog: ({
            petType: 'ImplicitDog';
          }) & (ImplicitDog);
      })[TPetType]);
