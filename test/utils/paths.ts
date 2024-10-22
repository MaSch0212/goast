import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// @deno-types="@types/fs-extra"
import fs from 'fs-extra';

declare const __dirname: string | undefined;
const scriptDir = typeof __dirname === 'undefined' ? dirname(fileURLToPath(import.meta.url)) : __dirname;

let _repoRootDir = scriptDir;
while (!fs.existsSync(join(_repoRootDir, '.git'))) {
  _repoRootDir = dirname(_repoRootDir);
}

export const repoRootDir: string = _repoRootDir;
const openApiFilesDir = join(_repoRootDir, 'test', 'openapi-files');
export const openApiV2FilesDir: string = join(openApiFilesDir, 'v2');
export const openApiV3FilesDir: string = join(openApiFilesDir, 'v3');
export const openApiV3_1FilesDir: string = join(openApiFilesDir, 'v3.1');
