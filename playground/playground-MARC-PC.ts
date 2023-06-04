import * as util from 'util';
import path from 'path';
import YAML from 'yaml';
import fs from 'fs-extra';
import { OpenApiGenerator, OpenApiParser } from '@goast/core';
import { TypeScriptModelsGenerator } from '@goast/typescript';

export async function main(): Promise<void> {
  const x = await new OpenApiGenerator({ outputDir: 'out' })
    .use(TypeScriptModelsGenerator, {
      immutableTypes: true,
      typeDeclaration: 'prefer-interface',
      importModuleTransformer: 'js-extension',
      enumGeneration: 'union',
    })
    .parseAndGenerate('.openapi/file1.yml', '.openapi/file2.yml');
  console.log(x);
}
