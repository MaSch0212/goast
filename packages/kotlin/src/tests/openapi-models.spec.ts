import { join } from 'path';

import fs from 'fs-extra';

import { OpenApiGenerator, toCustomCase } from '@goast/core';
import {
  MultipartData,
  OpenApiVersion,
  openApiV2FilesDir,
  openApiV3FilesDir,
  openApiV3_1FilesDir,
  verify,
} from '@goast/test/utils';

import { KotlinModelsGenerator } from '../lib/generators/models/models-generator';

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
      test(toCustomCase(fileWithoutExt, { wordCasing: 'all-lower', wordSeparator: ' ' }), async () => {
        const filePath = join(path, file);

        const result = new MultipartData();
        jest.spyOn(fs, 'ensureDirSync').mockImplementation();
        jest
          .spyOn(fs, 'writeFileSync')
          .mockImplementation((path: fs.PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView) => {
            result.push([path.toString(), data.toString()]);
          });

        const generatorOptions = {
          outputDir: 'out',
          newLine: '\n',
        };
        const state = await new OpenApiGenerator(generatorOptions)
          .useType(KotlinModelsGenerator, { __test__: true } as any)
          .parseAndGenerate(filePath);
        result.splice(0, 0, ['state', state]);

        jest.resetAllMocks();
        await verify(result);
      });
    }
  });
}
