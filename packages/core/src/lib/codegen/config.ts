import { OpenApiParserOptions } from '../parse';
import { defaultOpenApiTransformerOptions } from '../transform/types';
import { SourceBuilderOptions, defaultSourceBuilderOptions } from '../utils/source-builder';

export type OpenApiGeneratorConfig = SourceBuilderOptions &
  OpenApiParserOptions & {
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
