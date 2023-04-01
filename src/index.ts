import { chdir, cwd } from 'process';
import { Dref, OpenApiParser } from './parser.js';
import fs from 'fs-extra';
import path from 'path';
import { OpenAPI3, SchemaObject } from 'openapi-typescript';
import { OpenAPIV3 } from 'openapi-types';
import { collectOpenApiV3, isOpenApiV3 } from './open-api-v3/collector.js';

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

  if (isOpenApiV3(api2)) {
    const data = collectOpenApiV3(api2);
    await fs.writeJson('file2_out.json', data, { spaces: 2 });
  }
}

main();
