import { EOL } from 'node:os';

/**
 * Options for the `StringBuilder` class.
 */
export type StringBuilderOptions = {
  /**
   * The string to use for new lines.
   * @default os.EOL
   */
  readonly newLine: string;
};

/**
 * Default options for the `StringBuilder` class.
 */
export const defaultStringBuilderOptions: StringBuilderOptions = {
  newLine: EOL,
};
