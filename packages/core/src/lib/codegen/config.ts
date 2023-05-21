import { SourceBuilderOptions } from '../utils/source-builder.js';

type OpenApiGeneratorConfigAdditions = {
  outputDir: string;
  clearOutputDir: boolean;
};
export type OpenApiGeneratorConfig = Partial<SourceBuilderOptions> & OpenApiGeneratorConfigAdditions;
export type OpenApiGeneratorConfigOverrides = Partial<SourceBuilderOptions & OpenApiGeneratorConfigAdditions>;

export const defaultOpenApiGeneratorConfig: OpenApiGeneratorConfig = {
  outputDir: 'generated',
  clearOutputDir: true,
};
