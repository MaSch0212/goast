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

    /**
     * How to handle existing files in the output directory.
     * - 'override': overwrite existing files.
     * - 'skip': skip generating files that already exist.
     * - 'error': throw an error if a file already exists.
     * - 'count': write to a new path derived by inserting `_1` before the file extension (`_2`, `_3`, ... if that
     *   path is also taken). A counted file is written under a name no other generated file references. The
     *   generators compute a schema's file path from its name and use that same path when they emit an import or
     *   type reference, so the reference still points at the first file written. `'count'` makes a collision
     *   inspectable instead of fatal; it does not make the output correct.
     *
     * Is is recommended to use `'error'` to prevent issues of two schemas generating the same file and overwriting each other.
     * If `clearOutputDir` is set to `false`, it is recommended to use `'override'` to ensure that the generated files are up to date.
     * @default 'error'
     */
    existingFileBehavior: 'override' | 'skip' | 'error' | 'count';
  };

export const defaultOpenApiGeneratorConfig: OpenApiGeneratorConfig = {
  ...defaultSourceBuilderOptions,
  ...defaultOpenApiTransformerOptions,

  outputDir: 'generated',
  clearOutputDir: true,
  existingFileBehavior: 'error',
};
