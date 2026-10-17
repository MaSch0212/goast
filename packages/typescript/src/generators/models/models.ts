import type {
  ApiSchema,
  DefaultGenerationProviderConfig,
  ExtendedStringCasing,
  Nullable,
  OpenApiSchemasGenerationProviderContext,
} from '@goast/core';

import { ts } from '../../ast/index.ts';
import type { TypeScriptComponentOutput } from '../../common-results.ts';
import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import type { TypeScriptFileBuilder } from '../../file-builder.ts';

/**
 * The options of a single model. They control how the `TypeScriptModelGenerator` writes the model of each schema.
 * They extend the common TypeScript generator options.
 */
export type TypeScriptModelGeneratorConfig = TypeScriptGeneratorConfig & {
  /**
   * Determines how to generate enums.
   * - 'union': Generate enums as union types.
   * - 'prefer-enum': Generate enums as enums if possible, otherwise as union types.
   * @default 'union'
   */
  enumGeneration: 'union' | 'prefer-enum';

  /**
   * Whether to generate immutable types.
   * @default false
   */
  immutableTypes: boolean;

  /**
   * Whether to inline unnamed schemas. If false, unnamed schemas will be generated as separate types.
   * @default true
   */
  inlineUnnamedSchemas: boolean;

  /**
   * The directory where the models should be saved. The path is relative to the output directory.
   * @default 'models'
   */
  modelsDir: string;

  /**
   * The casing of the model file names. If nullish, the `fileNameCasing` is used.
   * @default undefined
   */
  modelFileNameCasing: Nullable<ExtendedStringCasing>;

  /**
   * Determines how to declare types.
   * - 'type': Always declare types as `type`.
   * - 'prefer-interface': Prefer `interface` over `type` if possible.
   * @default 'type'
   */
  typeDeclaration: 'type' | 'prefer-interface';

  /**
   * The casing to use for the base type of discriminator schemas.
   * @default `_<SchemaName>Base`
   */
  discriminatorBaseTypeCasing: ExtendedStringCasing;

  /**
   * The type to use for binary schemas.
   * @default `ts.refs.blob`
   */
  binarySchemaType: () => ts.Type<TypeScriptFileBuilder>;
};

/**
 * The options of the `TypeScriptModelsGenerator`. They extend the model options with the location of the index file
 * that re-exports all generated models.
 */
export type TypeScriptModelsGeneratorConfig = TypeScriptModelGeneratorConfig & {
  /**
   * The path to the index file where all models should be exported. If nullish, no index file will be generated.
   * @default 'models.ts'
   */
  modelsIndexFile: Nullable<string>;
};

/**
 * The default values of the `TypeScriptModelGeneratorConfig` options. Options that are not set take these values.
 * @see TypeScriptModelGeneratorConfig
 */
export const defaultTypeScriptModelGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptModelGeneratorConfig> = {
  ...defaultTypeScriptGeneratorConfig,

  enumGeneration: 'union',
  immutableTypes: false,
  inlineUnnamedSchemas: true,
  modelsDir: 'models',
  modelFileNameCasing: undefined,
  typeDeclaration: 'type',
  discriminatorBaseTypeCasing: { casing: 'pascal', prefix: '_', suffix: 'Base' },
  binarySchemaType: ts.refs.blob,
};

/**
 * The default values of the `TypeScriptModelsGeneratorConfig` options. Options that are not set take these values.
 * @see TypeScriptModelsGeneratorConfig
 */
export const defaultTypeScriptModelsGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptModelsGeneratorConfig> =
  {
    ...defaultTypeScriptModelGeneratorConfig,

    modelsIndexFile: 'models.ts',
  };

/**
 * The input of the `TypeScriptModelsGenerator`. It is empty because the generator only reads the schemas of the
 * OpenAPI documents from the context.
 */
export type TypeScriptModelsGeneratorInput = {};

/**
 * The output of the `TypeScriptModelsGenerator`. Later generators read the generated models and index file from it.
 */
export type TypeScriptModelsGeneratorOutput = {
  /**
   * The TypeScript results of the models generator.
   */
  typescript: {
    /**
     * The generated models, keyed by the ID of their schema (`ApiSchema['id']`).
     */
    models: {
      /**
       * The result for the schema with the given ID.
       */
      [schemaId: string]: TypeScriptModelGeneratorOutput;
    };
    /**
     * The index files that were generated.
     */
    indexFiles: {
      /**
       * The path to the models index file, or `null` if no index file was generated (`modelsIndexFile` is nullish).
       */
      models: Nullable<string>;
    };
  };
};

/**
 * The result of generating a single model. For a schema that is written to its own file, `component` is the declared
 * type name and `filePath` is set. For an inline schema, `component` is the type expression and no file is written.
 */
export type TypeScriptModelGeneratorOutput = TypeScriptComponentOutput;

/**
 * The context of the `TypeScriptModelsGenerator`. It is passed to the models generator for all schemas.
 * @see TypeScriptModelGeneratorContext
 */
export type TypeScriptModelsGeneratorContext = OpenApiSchemasGenerationProviderContext<
  TypeScriptModelsGeneratorInput,
  TypeScriptModelsGeneratorOutput,
  TypeScriptModelsGeneratorConfig,
  TypeScriptModelGeneratorOutput
>;

/**
 * The context of the `TypeScriptModelGenerator` for a single schema.
 * @see TypeScriptModelsGeneratorContext
 */
export type TypeScriptModelGeneratorContext = TypeScriptModelsGeneratorContext & {
  /**
   * The schema to generate the model for.
   */
  schema: ApiSchema;
};
