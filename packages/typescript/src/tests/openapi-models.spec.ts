import { join } from 'path';

import fs from 'fs-extra';

import { OpenApiGenerator } from '@goast/core';
import { toCustomCase } from '@goast/core/utils';
import { OpenApiVersion, openApiV2FilesDir, openApiV3FilesDir, openApiV3_1FilesDir, verify } from '@goast/test/utils';

import { TypeScriptModelsGenerator } from '../lib/generators/models/models-generator';

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
        jest.spyOn(fs, 'ensureDirSync').mockImplementation();
        jest
          .spyOn(fs, 'writeFileSync')
          .mockImplementation((path: fs.PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView) => {
            writtenFiles.set(path.toString(), data.toString());
          });

        const generatorOptions = {
          outputDir: 'out',
          newLine: '\n',
        };
        const state = await new OpenApiGenerator(generatorOptions)
          .use(TypeScriptModelsGenerator, { __test__: true } as any)
          .parseAndGenerate(filePath);
        writtenFiles.set('state', state);

        jest.resetAllMocks();
        await verify(writtenFiles);
      });
    }
  });
}
