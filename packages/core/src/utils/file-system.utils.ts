import { resolve } from 'node:path';

// @deno-types="npm:@types/fs-extra@11"
import fs from 'fs-extra';

import type { Nullable } from './type.utils.ts';

export type DirectoryScanOptions = {
  recursive: boolean;
  maxDepth: Nullable<number>;
  filter?: (file: string) => boolean;
};

export const defaultDirectoryScanOptions: DirectoryScanOptions = {
  recursive: false,
  maxDepth: 5,
};

export async function getFiles(dir: string, options?: Partial<DirectoryScanOptions>): Promise<string[]> {
  const opts = { ...defaultDirectoryScanOptions, ...options };
  const files: string[] = [];
  await getFilesImpl(dir, opts, files, 0);
  return files;
}

async function getFilesImpl(
  dir: string,
  options: DirectoryScanOptions,
  files: string[],
  currentDepth: number,
): Promise<void> {
  const dirFiles = await fs.readdir(dir);
  for (const file of dirFiles) {
    const filePath = resolve(dir, file);
    const stat = await fs.lstat(filePath);
    if (stat.isDirectory()) {
      if (options.recursive) {
        if (options.maxDepth && options.maxDepth > currentDepth) {
          getFilesImpl(filePath, options, files, currentDepth + 1);
        }
      }
    } else {
      if (!options.filter || options.filter(file)) {
        files.push(filePath);
      }
    }
  }
}
