import { AssetManager } from '@goast/core';
import { URL } from 'node:url';

const manager = new AssetManager(new URL('../assets/', import.meta.url));
export const getAssetFileContent = manager.getAssetFileContent.bind(manager);
