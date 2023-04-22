import { OpenApiParser } from '@easy-openapi-codegen/core';
import fs from 'fs-extra';
import * as util from 'util';

export async function main(): Promise<void> {
  const parser = new OpenApiParser();
  const data = await parser.parseApisAndTransform(['.openapi/file1.yml', '.openapi/file2.yml']);
  await fs.writeFile('combined_out.js', util.inspect(data, undefined, 100));
}
