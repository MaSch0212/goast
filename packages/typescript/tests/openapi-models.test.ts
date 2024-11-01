import { join } from 'node:path';

// @deno-types="npm:@types/fs-extra"
import fs from 'fs-extra';

import { OpenApiGenerator, toCustomCase } from '@goast/core';
import {
  MultipartData,
  openApiV2FilesDir,
  openApiV3_1FilesDir,
  openApiV3FilesDir,
  type OpenApiVersion,
  verify,
} from '@goast/test-utils';

import { afterEach, describe, test } from '@std/testing/bdd';
import { restore, stub } from '@std/testing/mock';

import { TypeScriptModelsGenerator } from '../src/generators/models/models-generator.ts';

const filePaths: { [P in OpenApiVersion]: string } = {
  '2.0': openApiV2FilesDir,
  '3.0': openApiV3FilesDir,
  '3.1': openApiV3_1FilesDir,
};

const testFilesAllVersions: string[] = ['simple-schemas.yml', 'detailed-schemas.yml', 'object-schemas.yml'];
const testFilesV3x: string[] = ['oneof-schemas.yml', 'discriminated-schemas.yml'];

for (const [version, path] of Object.entries(filePaths)) {
  describe(`OpenAPI V${version}`, () => {
    afterEach(() => {
      restore();
    });

    const testFiles = version.startsWith('3') ? testFilesAllVersions.concat(testFilesV3x) : testFilesAllVersions;
    for (const file of testFiles) {
      const fileWithoutExt = file.replace(/\.[^/.]+$/, '');
      test(toCustomCase(fileWithoutExt, { wordCasing: 'all-lower', wordSeparator: ' ' }), async (t) => {
        const filePath = join(path, file);

        const result = new MultipartData();
        stub(fs, 'ensureDirSync');
        stub(fs, 'writeFileSync', (path: fs.PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView) => {
          result.push([path.toString(), data.toString()]);
        });

        const generatorOptions = {
          outputDir: 'out',
          newLine: '\n',
        };
        const state = await new OpenApiGenerator(generatorOptions)
          // deno-lint-ignore no-explicit-any
          .useType(TypeScriptModelsGenerator, { __test__: true } as any)
          .parseAndGenerate(filePath);
        result.splice(0, 0, ['state', state]);

        restore();
        await verify(t, result);
      });
    }
  });
}
