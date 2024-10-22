import { AssetManager } from '@goast/core';
import { pathToFileURL } from 'node:url';

declare const __filename: string | undefined;
const scriptUrl = typeof __filename === 'undefined' ? import.meta.url : pathToFileURL(__filename);

const manager = new AssetManager(new URL('../../assets/', scriptUrl));
export const getAssetFileContent = manager.getAssetFileContent.bind(manager);
export const copyAssetFile = manager.copyAssetFile.bind(manager);
