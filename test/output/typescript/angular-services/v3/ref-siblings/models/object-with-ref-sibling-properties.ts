import type { Target } from './target';

export type ObjectWithRefSiblingProperties = {
    /**
     * The first property's own description.
     */
    first?: Target;

    /**
     * The second property's own description.
     */
    second?: Target;
  };
