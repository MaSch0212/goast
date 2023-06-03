import { join } from 'path';

import { OpenApiVersion, openApiV2FilesDir, openApiV3FilesDir, openApiV3_1FilesDir, verify } from '@goast/test/utils';

import { OpenApiParser } from '../lib/parse/parser';
import { toCustomCase } from '../lib/utils/string.utils';

const filePaths: { [P in OpenApiVersion]: string } = {
  '2.0': openApiV2FilesDir,
  '3.0': openApiV3FilesDir,
  '3.1': openApiV3_1FilesDir,
};

const testFilesAllVersions: string[] = ['simple-schemas.yml', 'detailed-schemas.yml', 'object-schemas.yml'];
const testFilesV3x: string[] = ['oneof-schemas.yml'];

for (const [version, path] of Object.entries(filePaths)) {
  describe(`OpenAPI V${version}`, () => {
    const testFiles = version.startsWith('3') ? testFilesAllVersions.concat(testFilesV3x) : testFilesAllVersions;
    for (const file of testFiles) {
      const fileWithoutExt = file.replace(/\.[^/.]+$/, '');
      test(toCustomCase(fileWithoutExt, { wordCasing: 'all-lower', wordSeparator: ' ' }), async () => {
        const filePath = join(path, file);
        const data = await new OpenApiParser().parseApisAndTransform(filePath);

        // Remove properties that do not need to be verified
        for (const schema of Object.values(data.schemas)) {
          delete (schema.$src as any).document;
        }

        await verify(data.schemas);
      });
    }
  });
}
