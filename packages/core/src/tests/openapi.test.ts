import { join } from 'node:path';

import {
  declutterApiData,
  openApiV2FilesDir,
  openApiV3_1FilesDir,
  openApiV3FilesDir,
  type OpenApiVersion,
  verify,
} from '@goast/test-utils';

import { OpenApiParser } from '../lib/parse/parser.ts';
import { toCustomCase } from '../lib/utils/string.utils.ts';
import { describe, it } from '@std/testing/bdd';

const filePaths: { [P in OpenApiVersion]: string } = {
  '2.0': openApiV2FilesDir,
  '3.0': openApiV3FilesDir,
  '3.1': openApiV3_1FilesDir,
};

const testFilesAllVersions: string[] = ['simple-schemas.yml', 'detailed-schemas.yml', 'object-schemas.yml'];
const testFilesV3x: string[] = ['oneof-schemas.yml', 'discriminated-schemas.yml'];

for (const [version, path] of Object.entries(filePaths)) {
  describe(`OpenAPI V${version}`, () => {
    const testFiles = version.startsWith('3') ? testFilesAllVersions.concat(testFilesV3x) : testFilesAllVersions;
    for (const file of testFiles) {
      const fileWithoutExt = file.replace(/\.[^/.]+$/, '');
      it(
        toCustomCase(fileWithoutExt, {
          wordCasing: 'all-lower',
          wordSeparator: ' ',
        }),
        async (t) => {
          const filePath = join(path, file);
          const data = await new OpenApiParser().parseApisAndTransform(filePath);

          // Remove properties that do not need to be verified
          for (const schema of Object.values(data.schemas)) {
            delete (schema.$src as Record<string, unknown>).document;
          }

          declutterApiData(data);
          await verify(t, data);
        },
      );
    }
  });
}
