import { basename, dirname, join, resolve } from 'node:path';

import fs from 'fs-extra';

import type { OpenApiGeneratorConfig } from '../codegen/config.ts';
import type { Nullable } from './type.utils.ts';

/**
 * Options for scanning a directory with `getFiles`.
 * @see getFiles
 */
export type DirectoryScanOptions = {
  /**
   * Whether to include the files of subdirectories.
   * @default false
   */
  recursive: boolean;
  /**
   * The maximum number of subdirectory levels to scan when `recursive` is `true`. `null` or `0` prevents subdirectories
   * from being entered.
   * @default 5
   */
  maxDepth: Nullable<number>;
  /**
   * A predicate that receives the name of each file (without its directory) and returns whether to include it.
   * All files are included if omitted.
   */
  filter?: (file: string) => boolean;
};

/**
 * Default options for `getFiles`. Subdirectories are not scanned, and a maximum depth of 5 applies once `recursive` is
 * enabled.
 */
export const defaultDirectoryScanOptions: DirectoryScanOptions = {
  recursive: false,
  maxDepth: 5,
};

/**
 * Gets the absolute paths of the files in the specified directory. Subdirectories are only scanned if `recursive` is
 * enabled. Symbolic links are not followed; a link is returned like a regular file.
 * @param dir The directory to scan.
 * @param options The scan options. Merged with `defaultDirectoryScanOptions`, so omitted options use their defaults.
 * @returns A promise that resolves to the absolute paths of the matching files.
 */
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

/**
 * Writes generated content to the specified file, creating missing parent directories. If the file already exists, the
 * `existingFileBehavior` of the configuration decides what happens.
 * @param config The generator configuration. Its `existingFileBehavior` applies when the file already exists:
 * `'override'` overwrites it, `'error'` throws, `'skip'` leaves it unchanged, and `'count'` writes to the next free
 * path such as `file_1.ts`.
 * @param filePath The path of the file to write.
 * @param content The content to write.
 */
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
