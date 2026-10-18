import {
  type ApiSchema,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiSchemasGenerationProviderBase,
} from '@goast/core';

import { getAssetFileContent } from '../../assets.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import { getGoIdentifierRegistry } from '../../identifier-registry.ts';
import type { GoPackageInfo } from '../file-generator.ts';
import { DefaultGoModelGenerator, type GoModelGenerator } from './model-generator.ts';
import {
  defaultGoModelsGeneratorConfig,
  type GoModelGeneratorOutput,
  type GoModelsGeneratorConfig,
  type GoModelsGeneratorContext,
  type GoModelsGeneratorInput,
  type GoModelsGeneratorOutput,
} from './models.ts';

type Input = GoModelsGeneratorInput;
type Output = GoModelsGeneratorOutput;
type Config = GoModelsGeneratorConfig;
type SchemaOutput = GoModelGeneratorOutput;
type Context = GoModelsGeneratorContext;

/**
 * Generates a Go type for every schema: structs for objects, and named types with constants for enums.
 *
 * Each schema is passed to the `GoModelGenerator` created by the model generator factory. A schema that gets its own
 * declaration is written to `{outputDir}/{packagePath}/{file}.go`, where the file name is derived from the type name.
 * Other schemas, such as primitives and ordinary arrays, get no file. Every model of a run is declared in the same
 * package (`packagePath`, default `api`), which is also the package the `GoServersGenerator` writes into by default,
 * so the two share a package. Structs with additional properties also get an `additional_properties.go` file with the
 * helpers that their `MarshalJSON` and `UnmarshalJSON` methods call.
 *
 * The result of every schema is stored under `go.models`, keyed by the schema ID.
 * @see GoModelsGeneratorConfig
 * @see DefaultGoModelGenerator
 */
export class GoModelsGenerator extends OpenApiSchemasGenerationProviderBase<
  Input,
  Output,
  Config,
  SchemaOutput,
  Context
> {
  private readonly _modelGeneratorFactory: Factory<GoModelGenerator, []>;

  /**
   * Initializes a new instance of the GoModelsGenerator class.
   * @param modelGeneratorFactory Creates the generator used for each schema. Defaults to a `DefaultGoModelGenerator`.
   */
  constructor(modelGeneratorFactory?: Factory<GoModelGenerator, []>) {
    super();
    this._modelGeneratorFactory = modelGeneratorFactory ?? Factory.fromValue(new DefaultGoModelGenerator());
  }

  /**
   * Creates the empty result of a run, which has no models yet.
   * @returns The result with an empty `go.models` map.
   */
  protected override initResult(): Output {
    return {
      go: {
        models: {},
      },
    };
  }

  /**
   * Creates the context of a run from the generation context and the configuration. The configuration is merged on top
   * of `defaultGoModelsGeneratorConfig`, and the context starts without any packages that need the additional
   * properties helpers.
   * @param context The generation context of the run.
   * @param config The configuration passed to the generator. Options that are not set use the defaults.
   * @returns The context used for all schemas of the run.
   */
  protected override buildContext(
    context: OpenApiGeneratorContext<GoModelsGeneratorInput>,
    config?: Partial<Config> | undefined,
  ): Context {
    const providerContext = this.getProviderContext(context, config, defaultGoModelsGeneratorConfig);
    return Object.assign(providerContext, {
      packagesWithAdditionalProperties: new Map<string, GoPackageInfo>(),
    });
  }

  /**
   * Generates the model for one schema by passing it to a new model generator from the factory.
   * @param ctx The context of the run.
   * @param schema The schema to generate the model for.
   * @returns The result for the schema, which describes its Go type, or a promise of it.
   */
  protected override generateSchema(ctx: Context, schema: ApiSchema): MaybePromise<SchemaOutput> {
    const modelGenerator = this._modelGeneratorFactory.create();
    return modelGenerator.generate({
      ...ctx,
      schema,
    });
  }

  /**
   * Stores the result of a schema under `go.models`, keyed by the ID of the schema.
   * @param ctx The context of the run, whose output receives the result.
   * @param schema The schema the result belongs to.
   * @param result The result of generating the model for the schema.
   */
  protected override addSchemaResult(ctx: Context, schema: ApiSchema, result: SchemaOutput): void {
    ctx.output.go.models[schema.id] = result;
  }

  /**
   * Writes the additional files of the run. Every package that contains a struct with additional properties gets the
   * helpers for them, once per package.
   * @param ctx The context of the run, which lists the packages that need the helpers.
   */
  protected override async generateAdditionalFiles(ctx: Context): Promise<void> {
    for (const pkg of ctx.packagesWithAdditionalProperties.values()) {
      await this.generateAdditionalPropertiesHelpers(ctx, pkg);
    }
  }

  /**
   * Writes the `additional_properties.go` file to a package. The file holds the generic functions that the
   * `MarshalJSON` and `UnmarshalJSON` methods of structs with additional properties call, taken from the bundled
   * `models/additional_properties.go` asset without its package clause and imports. The file name is reserved in the
   * identifier registry of the package, so it gets a counter if another file already uses the name.
   * @param ctx The context of the run.
   * @param pkg The package to write the helpers into.
   */
  protected async generateAdditionalPropertiesHelpers(ctx: Context, pkg: GoPackageInfo): Promise<void> {
    const files = getGoIdentifierRegistry(ctx.data, `${pkg.importPath}\u0000files`);
    const filePath = `${pkg.dir}/${files.reserve('additional_properties')}.go`;
    console.log(`Generating additional properties helpers to ${filePath}...`);

    const builder = new GoFileBuilder(pkg.name, pkg.importPath, ctx.config);
    builder.imports.addImport('encoding/json');
    const content = await getAssetFileContent('models/additional_properties.go');
    builder.append(content.replace(/^[\s\S]*?\nimport [^\n]*\n\n/, ''));
    builder.writeToFile(filePath);
  }
}
