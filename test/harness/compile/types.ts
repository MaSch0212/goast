import type { SpecVersionDir } from '../specs.ts';

/** The two target languages tier 3 compiles. */
export type CompileLanguage = 'kotlin' | 'typescript';

/**
 * One committed generated tree that must be valid in its language.
 *
 * `id` is `<language>/<profile>/<versionDir>/<spec>` and is both the unit's stable name in test output
 * and its snapshot path under `test/compile/`.
 */
export type CompileUnit = {
  language: CompileLanguage;
  profile: string;
  versionDir: SpecVersionDir;
  spec: string;
  /** Absolute path to the committed tree. */
  treeDir: string;
  id: string;
};

/**
 * One compiler diagnostic, reduced to what is stable across runs and machines.
 *
 * `file` is relative to the unit's tree with forward slashes, so the snapshot does not encode a
 * container path or a checkout location. It is `''` when the compiler blamed no particular file.
 * `line` and `column` are `null` when the compiler gave none.
 */
export type Diagnostic = {
  file: string;
  line: number | null;
  column: number | null;
  message: string;
};

/** The subset of the tier-2 profile registry that unit discovery needs. */
export type UnitRegistryEntry = {
  name: string;
  language: CompileLanguage;
  versions: 'all' | SpecVersionDir[];
};
