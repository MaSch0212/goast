import { join } from 'path';

import fs from 'fs-extra';

import { OpenApiParser, OpenApiVersion, generate } from '@goast/core';
import { openApiV2FilesDir, openApiV3FilesDir, openApiV3_1FilesDir, verify } from '@goast/test/utils';

import { TypeScriptModelsGenerator } from '../lib/model-generator.js';
import { toCustomCase } from '@goast/core/utils';

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

        const writtenFiles: Map<string, unknown> = new Map();
        jest.spyOn(fs, 'ensureDir').mockImplementation(() => Promise.resolve());
        jest
          .spyOn(fs, 'writeFile')
          .mockImplementation((path: fs.PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView) => {
            writtenFiles.set(path.toString(), data.toString());
            return Promise.resolve();
          });

        const data = await new OpenApiParser().parseApisAndTransform(filePath);
        const state = await generate(data, { outputDir: 'out', newLine: '\n' }, new TypeScriptModelsGenerator());
        writtenFiles.set('state', state);

        jest.resetAllMocks();
        await verify(writtenFiles);
      });
    }
  });
}
