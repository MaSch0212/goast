import type { Base } from './base';

export type AllOfNullableBranch = (Base) & ({
      nullableValue?: (string) | (null);
    });
