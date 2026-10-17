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

/** Generates a Go type for every schema: structs for objects, and named types with constants for enums. */
export class GoModelsGenerator extends OpenApiSchemasGenerationProviderBase<
  Input,
  Output,
  Config,
  SchemaOutput,
  Context
> {
  private readonly _modelGeneratorFactory: Factory<GoModelGenerator, []>;

  constructor(modelGeneratorFactory?: Factory<GoModelGenerator, []>) {
    super();
    this._modelGeneratorFactory = modelGeneratorFactory ?? Factory.fromValue(new DefaultGoModelGenerator());
  }

  protected override initResult(): Output {
    return {
      go: {
        models: {},
      },
    };
  }

  protected override buildContext(
    context: OpenApiGeneratorContext<GoModelsGeneratorInput>,
    config?: Partial<Config> | undefined,
  ): Context {
    const providerContext = this.getProviderContext(context, config, defaultGoModelsGeneratorConfig);
    return Object.assign(providerContext, {
      packagesWithAdditionalProperties: new Map<string, GoPackageInfo>(),
    });
  }

  protected override generateSchema(ctx: Context, schema: ApiSchema): MaybePromise<SchemaOutput> {
    const modelGenerator = this._modelGeneratorFactory.create();
    return modelGenerator.generate({
      ...ctx,
      schema,
    });
  }

  protected override addSchemaResult(ctx: Context, schema: ApiSchema, result: SchemaOutput): void {
    ctx.output.go.models[schema.id] = result;
  }

  protected override async generateAdditionalFiles(ctx: Context): Promise<void> {
    for (const pkg of ctx.packagesWithAdditionalProperties.values()) {
      await this.generateAdditionalPropertiesHelpers(ctx, pkg);
    }
  }

  /** The functions the `MarshalJSON` and `UnmarshalJSON` methods of structs with additional properties call. */
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
