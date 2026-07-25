export type MixedEnum =
  | ('one')
  | (2)
  | (true)
  | (null);

/**
 * All possible values of the enum `MixedEnum`.
 */
export const MIXED_ENUM_VALUES = [
  'one',
  2,
  true,
  null
] as const;
