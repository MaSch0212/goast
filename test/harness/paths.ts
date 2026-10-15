import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

let _repoRootDir = import.meta.dirname;
while (!existsSync(join(_repoRootDir, '.git'))) {
  const parent = dirname(_repoRootDir);
  if (parent === _repoRootDir) throw new Error(`No .git found above ${import.meta.dirname}`);
  _repoRootDir = parent;
}

export const repoRootDir: string = _repoRootDir;

/** Root of the OpenAPI corpus. */
export const specsDir: string = join(_repoRootDir, 'test', 'specs');

/** Root of the committed tier-2 snapshots. */
export const snapshotRootDir: string = join(_repoRootDir, 'test', 'output');

/** Root of the committed tier-4 wire deviations. */
export const wireRootDir: string = join(_repoRootDir, 'test', 'wire');
