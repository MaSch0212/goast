import { CodeGenerator, CodeGeneratorContext } from '@easy-openapi-codegen/core';
import { StringCasing, StringCasingWithOptions, toCasing } from '@easy-openapi-codegen/core/utils';
import fs from 'fs-extra';
import { dirname, join, resolve } from 'path';

export type TypeScriptModelsGeneratorResult = {
  models: {
    [schemaId: number]: {
      typeName: string;
      filePath: string;
    };
  };
};
export type TypeScriptModelsGeneratorConfig = {
  enumGeneration: 'union' | 'number-enum' | 'string-enum';
  modelsPath: string;
  fileNameCasing: StringCasing | StringCasingWithOptions;
  typeNameCasing: StringCasing | StringCasingWithOptions;
};

const defaultConfig: TypeScriptModelsGeneratorConfig = {
  enumGeneration: 'union',
  modelsPath: 'models',
  fileNameCasing: { casing: 'kebab', suffix: '.model' },
  typeNameCasing: 'pascal',
};

//export type TypeScriptModelsGenerator = CodeGenerator<OpenApiData, TypeScriptModelsGeneratorResult>;
// export function getTypeScriptModelsGenerator(
//   config: TypeScriptModelsGeneratorConfig
// ): TypeScriptModelsGenerator {
//   return async (
//     data: OpenApiData,
//     config: CodeGeneratorConfig & TypeScriptModelsGeneratorConfig
//   ): Promise<TypeScriptModelsGeneratorResult> => {
//     return {
//       models: {},
//     };
//   };
// }

export class TypeScriptModelsGenerator
  implements CodeGenerator<Record<string, unknown>, TypeScriptModelsGeneratorResult>
{
  private config: TypeScriptModelsGeneratorConfig;

  constructor(config?: Partial<TypeScriptModelsGeneratorConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  public async generate({
    data,
    config: globalConfig,
  }: CodeGeneratorContext<Record<string, unknown>>): Promise<TypeScriptModelsGeneratorResult> {
    const result: TypeScriptModelsGeneratorResult = { models: {} };

    for (const schema of data.schemas) {
      if (
        schema.kind === 'array' ||
        schema.kind === 'combined' ||
        schema.kind === 'multi-type' ||
        schema.kind === 'object' ||
        schema.kind === 'oneOf'
      ) {
        const typeName = toCasing(schema.name, this.config.typeNameCasing);
        const filePath = resolve(
          join(
            globalConfig.outputDir,
            this.config.modelsPath,
            `${toCasing(schema.name, this.config.fileNameCasing)}.ts`
          )
        );

        console.log(`Generating model ${typeName} to ${filePath}...`);
        await fs.ensureDir(dirname(filePath));
        await fs.writeFile(filePath, `export type ${typeName} = any;`);

        result.models[schema.id] = { typeName, filePath };
      }
    }

    return result;
  }
}
