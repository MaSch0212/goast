import type { NestedBranchA } from './nested-branch-a';
import type { NestedBranchB } from './nested-branch-b';

export type AllOfContainingOneOf = ((NestedBranchA) | (NestedBranchB)) & ({
      extra?: string;
    });
