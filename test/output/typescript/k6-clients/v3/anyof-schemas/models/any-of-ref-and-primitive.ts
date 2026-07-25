import type { Alpha } from './alpha';

export type AnyOfRefAndPrimitive = (Partial<Alpha>) & (Partial<string>);
