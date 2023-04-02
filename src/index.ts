import fs from 'fs-extra';
import { collectOpenApiV3, isOpenApiV3 } from './open-api-v3/collector.js';
import { OpenApiParser } from './parser.js';
import { transformOpenApiV3 } from './open-api-v3/transformer.js';
import * as util from 'util';

//chdir('.openapi');

// function mergeApis(...apis: OpenAPI.Document<{}>[]) {
//   const mergedApi = deepmerge.all(apis, { clone: true });
//   return mergedApi;
// }

// const fileNames = ['file1.yml', 'file2.yml'];

// const api1 = await SwaggerParser.parse(fileNames[0]);
// const api2 = await SwaggerParser.parse(fileNames[1]);

async function main(): Promise<void> {
  const parser = new OpenApiParser();
  const api2 = await parser.parseApi('.openapi/file2.yml');
  //await fs.writeJson('file2_out.json', api2, { spaces: 2 });

  const apis = await Promise.all([
    parser.parseApi('.openapi/file1.yml'),
    parser.parseApi('.openapi/file2.yml'),
  ]);

  if (apis.every(isOpenApiV3)) {
    const cData = collectOpenApiV3(apis);
    const data = transformOpenApiV3(cData);

    await fs.writeFile('combined_out.js', util.inspect(data, undefined, 100));
  }
}

main();
