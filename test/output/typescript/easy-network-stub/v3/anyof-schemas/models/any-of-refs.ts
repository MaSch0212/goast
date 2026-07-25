import type { Alpha } from './alpha';
import type { Beta } from './beta';

export type AnyOfRefs = (Partial<Alpha>) & (Partial<Beta>);
