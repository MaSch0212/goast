import { EOL } from 'os';

/**
 * Options for the StringBuilder class.
 * @default newLine = os.EOL
 */
export type StringBuilderOptions = {
  readonly newLine: string;
};

export const defaultStringBuilderOptions: StringBuilderOptions = {
  newLine: EOL,
};
