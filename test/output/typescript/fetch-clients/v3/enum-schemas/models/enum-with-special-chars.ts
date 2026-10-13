export type EnumWithSpecialChars =
  | ('has space')
  | ('has-hyphen')
  | ('has.dot')
  | ('has/slash')
  | ('has+plus');

/**
 * All possible values of the enum `EnumWithSpecialChars`.
 */
export const ENUM_WITH_SPECIAL_CHARS_VALUES = [
  'has space',
  'has-hyphen',
  'has.dot',
  'has/slash',
  'has+plus'
] as const;
