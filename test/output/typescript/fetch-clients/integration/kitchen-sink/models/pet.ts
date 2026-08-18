import type { Owner } from './owner';
import type { PetStatus } from './pet-status';
import type { Toy } from './toy';

export type Pet = {
    id: string;
    name: string;
    nickname?: (string) | (null);
    age?: number;
    status?: PetStatus;
    birthDate?: string;
    createdAt?: string;
    photo?: string;
    owner?: Owner;
    friend?: never;
    toys?: (Toy)[];
  };
