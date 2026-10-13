import type { ArrayOfString } from './array-of-string';

export type ObjectWithArrayProperties = {
    strings?: (string)[];
    refs?: (ArrayOfString)[];
    nested?: ((string)[])[];
  };
