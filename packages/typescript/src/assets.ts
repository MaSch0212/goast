import { AssetManager } from '@goast/core';
import { URL } from 'node:url';

const manager = new AssetManager(new URL('../assets/', import.meta.url));
/**
 * Gets the text content of an asset file that is shipped with the TypeScript generator package. The files are read
 * from the `assets` directory of the package.
 * @param relativePath The path of the asset file, relative to the `assets` directory, such as `client/angular/...`.
 * @returns The text content of the asset file.
 */
export const getAssetFileContent = manager.getAssetFileContent.bind(manager);
/**
 * Copies an asset file that is shipped with the TypeScript generator package into a directory. The file keeps its
 * base name and replaces any existing file with that name.
 * @param relativePath The path of the asset file, relative to the `assets` directory.
 * @param destDir The directory to copy the file into.
 * @param logName The name to show in the log message. Nothing is logged if omitted, and an empty string logs the path.
 * @returns A promise that resolves when the file has been copied.
 * @example
 * ```ts
 * await copyAssetFile('client/angular/request-builder.ts', targetDir, 'Request Builder');
 * ```
 */
export const copyAssetFile = manager.copyAssetFile.bind(manager);
