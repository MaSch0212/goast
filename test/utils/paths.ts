import { join, resolve } from 'path';

export const nxRootDir = resolve(__dirname, '..', '..');

const openApiFilesDir = join(nxRootDir, 'test', 'openapi-files');
export const openApiV2FilesDir = join(openApiFilesDir, 'v2');
export const openApiV3FilesDir = join(openApiFilesDir, 'v3');
export const openApiV3_1FilesDir = join(openApiFilesDir, 'v3.1');
