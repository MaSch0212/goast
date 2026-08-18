import { basename, dirname, join, resolve } from 'node:path';

// @deno-types="npm:@types/fs-extra@11"
import fs from 'fs-extra';

import type { OpenApiGeneratorConfig } from '../codegen/config.ts';
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
          await getFilesImpl(filePath, options, files, currentDepth + 1);
        }
      }
    } else {
      if (!options.filter || options.filter(file)) {
        files.push(filePath);
      }
    }
  }
}

/**
 * Splits a file name into its base and extension, treating the extension as everything from the last dot onward
 * (including the dot). A name with no dot has an empty extension. A name that is nothing but an extension (e.g.
 * `.kt`) has an empty base.
 */
function splitFileName(fileName: string): { base: string; ext: string } {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1) {
    return { base: fileName, ext: '' };
  }
  return { base: fileName.slice(0, dotIndex), ext: fileName.slice(dotIndex) };
}

/**
 * Finds an unused path derived from `filePath` by inserting `_1` before the extension, then `_2`, and so on, until
 * a path that does not yet exist is found.
 */
function getCountedFilePath(filePath: string): string {
  const dir = dirname(filePath);
  const { base, ext } = splitFileName(basename(filePath));

  let counter = 1;
  let candidate = join(dir, `${base}_${counter}${ext}`);
  while (fs.existsSync(candidate)) {
    counter++;
    candidate = join(dir, `${base}_${counter}${ext}`);
  }
  return candidate;
}

export function writeGeneratedFile(config: OpenApiGeneratorConfig, filePath: string, content: string): void {
  let targetPath = filePath;

  if (config.existingFileBehavior !== 'override' && fs.existsSync(filePath)) {
    if (config.existingFileBehavior === 'error') {
      throw new Error(`File already exists: ${filePath}`);
    }
    if (config.existingFileBehavior === 'skip') {
      return;
    }
    // config.existingFileBehavior === 'count'
    targetPath = getCountedFilePath(filePath);
  }

  fs.ensureDirSync(dirname(targetPath));
  fs.writeFileSync(targetPath, content);
}
