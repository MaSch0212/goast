import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// @deno-types="npm:@types/fs-extra@11"
import fs from 'fs-extra';

declare const __dirname: string | undefined;
const scriptDir = typeof __dirname === 'undefined' ? dirname(fileURLToPath(import.meta.url)) : __dirname;

let _repoRootDir = scriptDir;
while (!fs.existsSync(join(_repoRootDir, '.git'))) {
  _repoRootDir = dirname(_repoRootDir);
}

export const repoRootDir: string = _repoRootDir;

/** Root of the OpenAPI corpus. */
export const specsDir: string = join(_repoRootDir, 'test', 'specs');

/** Root of the committed tier-2 snapshots. */
export const snapshotRootDir: string = join(_repoRootDir, 'test', 'output');
