import fs from 'fs-extra';
import * as util from 'util';
import { OpenApiParser } from './parser.js';

async function main(): Promise<void> {
  const parser = new OpenApiParser();
  const data = await parser.parseApisAndTransform(['.openapi/file1.yml', '.openapi/file2.yml']);
  await fs.writeFile('combined_out.js', util.inspect(data, undefined, 100));
}

console.time('main');
main().then(() => console.timeEnd('main'));
