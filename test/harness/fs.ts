import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export type WalkFilesOptions = {
  /** Directories (absolute path) to not descend into. */
  skipDir?: (path: string) => boolean;
};

/**
 * Regular files under `root`, recursively, as absolute paths sorted by plain string comparison.
 *
 * Symlinks are neither followed nor returned. Dotfiles are included: a generator can emit `models/.ts`.
 */
export async function walkFiles(root: string, options: WalkFilesOptions = {}): Promise<string[]> {
  const files: string[] = [];
  const visit = async (dir: string): Promise<void> => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (options.skipDir?.(path) !== true) await visit(path);
      } else if (entry.isFile()) {
        files.push(path);
      }
    }
  };
  await visit(root);
  return files.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** Whether `error` is a Node file-system error for a missing path. */
export function isNotFound(error: unknown): boolean {
  return error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT';
}
