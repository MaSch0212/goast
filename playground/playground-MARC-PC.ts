import { OpenApiParser, generate } from '@goast/core';
import { TypeScriptModelsGenerator } from '@goast/typescript';
import fs from 'fs-extra';
import * as util from 'util';

export async function main(): Promise<void> {
  const parser = new OpenApiParser();
  const data = await parser.parseApisAndTransform(['.openapi/file1.yml', '.openapi/file2.yml']);

  const x = await generate(
    data,
    { outputDir: 'out' },
    new TypeScriptModelsGenerator({
      immutableTypes: true,
      typeDeclaration: 'prefer-interface',
      importModuleTransformer: 'js-extension',
      enumGeneration: 'union',
    })
  );
  console.log(x);

  //await fs.writeFile('combined_out.js', util.inspect(data, undefined, 100));
}
