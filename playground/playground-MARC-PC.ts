import * as util from 'util';
import path from 'path';
import YAML from 'yaml';
import fs from 'fs-extra';
import { OpenApiParser } from '@goast/core';

export async function main(): Promise<void> {
  const api = await new OpenApiParser().parseApi('.openapi/file1.yml');

  await fs.writeFile('out/x.json', util.inspect(api, { depth: 20, showProxy: true }));

  // const x = await new OpenApiGenerator({ outputDir: 'out' })
  //   .use(TypeScriptModelsGenerator, {
  //     immutableTypes: true,
  //     typeDeclaration: 'prefer-interface',
  //     importModuleTransformer: 'js-extension',
  //     enumGeneration: 'union',
  //   })
  //   .parseAndGenerate('.openapi/file1.yml', '.openapi/file2.yml');
  //console.log(x);
}
