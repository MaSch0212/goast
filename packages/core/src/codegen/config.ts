import type { OpenApiParserOptions } from '../parse/types.ts';
import { defaultOpenApiTransformerOptions } from '../transform/types.ts';
import { defaultSourceBuilderOptions, type SourceBuilderOptions } from '../utils/source-builder.ts';

export type OpenApiGeneratorConfig =
  & SourceBuilderOptions
  & OpenApiParserOptions
  & {
    /**
     * The directory where the generated files should be saved.
     * @default 'generated'
     */
    outputDir: string;

    /**
     * Whether to clear the output directory before generating the files.
     * @default true
     */
    clearOutputDir: boolean;
  };

export const defaultOpenApiGeneratorConfig: OpenApiGeneratorConfig = {
  ...defaultSourceBuilderOptions,
  ...defaultOpenApiTransformerOptions,

  outputDir: 'generated',
  clearOutputDir: true,
};
