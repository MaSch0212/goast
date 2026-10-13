export type EnumWithReservedWords =
  | ('class')
  | ('object')
  | ('null')
  | ('true')
  | ('return');

/**
 * All possible values of the enum `EnumWithReservedWords`.
 */
export const ENUM_WITH_RESERVED_WORDS_VALUES = [
  'class',
  'object',
  'null',
  'true',
  'return'
] as const;
