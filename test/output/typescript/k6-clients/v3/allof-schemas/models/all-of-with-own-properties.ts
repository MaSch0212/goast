import type { Base } from './base';

export type AllOfWithOwnProperties = ({
      ownField: string;
    }) & (Base);
