import { AssetManager } from '@goast/core';
import { URL } from 'node:url';

const manager = new AssetManager(new URL('../assets/', import.meta.url));
/**
 * Gets the text content of a file from the `assets` directory that ships with this package. The directory is resolved
 * relative to this module. Rejects if the file cannot be read.
 * @param relativePath The path of the asset file, relative to the assets directory.
 * @returns A promise that resolves with the text content of the asset file.
 * @see AssetManager.getAssetFileContent
 */
export const getAssetFileContent = manager.getAssetFileContent.bind(manager);
/**
 * Copies a file from the `assets` directory that ships with this package into a directory, keeping its base name. An
 * existing file at the target path is overwritten.
 * @param relativePath The path of the asset file, relative to the assets directory.
 * @param destDir The directory to copy the file into.
 * @param logName The name to show in the log message. Nothing is logged if omitted, and the relative path is logged if
 * empty.
 * @returns A promise that resolves when the file has been copied.
 * @see AssetManager.copyAssetFile
 */
export const copyAssetFile = manager.copyAssetFile.bind(manager);
