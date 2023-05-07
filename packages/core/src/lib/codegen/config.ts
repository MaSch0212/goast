import { EOL } from 'os';
import { IndentOptions } from '../utils/source-builder.js';

export type CodeGeneratorConfig = Readonly<{
  outputDir: string;
  clearOutputDir: boolean;
  indent: IndentOptions;
  newLine: string;
}>;

export const defaultCodeGeneratorConfig: CodeGeneratorConfig = {
  outputDir: 'generated',
  clearOutputDir: true,
  indent: { type: 'spaces', count: 2 },
  newLine: EOL,
};
