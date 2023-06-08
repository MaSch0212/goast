import { SourceBuilderOptions, defaultSourceBuilderOptions } from '../utils/source-builder';

export type OpenApiGeneratorConfig = SourceBuilderOptions & {
  outputDir: string;
  clearOutputDir: boolean;
};

export const defaultOpenApiGeneratorConfig: OpenApiGeneratorConfig = {
  ...defaultSourceBuilderOptions,

  outputDir: 'generated',
  clearOutputDir: true,
};
