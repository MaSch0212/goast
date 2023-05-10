import { join } from 'path';

import {
  openApiV2FilesDir,
  openApiV3FilesDir,
  openApiV3_1FilesDir,
  verify,
} from '@goast/test/utils';

import { OpenApiParser } from '../parser.js';
import { OpenApiVersion } from '../types.js';
import { toCustomCase } from '../utils/string.utils.js';


const filePaths: { [P in OpenApiVersion]: string } = {
  '2.0': openApiV2FilesDir,
  '3.0': openApiV3FilesDir,
  '3.1': openApiV3_1FilesDir,
};

const testFilesAllVersions: string[] = ['simple-schemas.yml'];
const testFilesV3x: string[] = [];

for (const [version, path] of Object.entries(filePaths)) {
  describe(`OpenAPI V${version}`, () => {
    const testFiles = version.startsWith('3')
      ? testFilesAllVersions.concat(testFilesV3x)
      : testFilesAllVersions;
    for (const file of testFiles) {
      const fileWithoutExt = file.replace(/\.[^/.]+$/, '');
      test(
        toCustomCase(fileWithoutExt, { wordCasing: 'all-lower', wordSeparator: ' ' }),
        async () => {
          const filePath = join(path, file);
          const data = await new OpenApiParser().parseApisAndTransform(filePath);
          await verify(data);
        }
      );
    }
  });
}
