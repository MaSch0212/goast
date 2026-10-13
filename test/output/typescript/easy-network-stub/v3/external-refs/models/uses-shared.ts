import type { SharedEnum } from './shared-enum';
import type { SharedThing } from './shared-thing';

export type UsesShared = {
    thing?: SharedThing;
    status?: SharedEnum;
  };
