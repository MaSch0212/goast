import { AssetManager } from '@goast/core';
import { URL } from 'node:url';

const manager = new AssetManager(new URL('../assets/', import.meta.url));

/**
 * Reads the content of a Go source file that ships with the package, such as the runtime code that generated servers
 * and models include. The path is relative to the package's `assets` directory.
 * @param relativePath The path of the asset, relative to the `assets` directory, such as
 * `models/additional_properties.go`.
 * @returns A promise of the content of the file.
 */
export const getAssetFileContent = manager.getAssetFileContent.bind(manager);
