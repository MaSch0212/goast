import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// @deno-types="npm:@types/fs-extra@11"
import fs from 'fs-extra';

export class AssetManager {
  private readonly _assetsBaseUrl: URL;

  constructor(assetsBaseUrl: URL) {
    this._assetsBaseUrl = assetsBaseUrl;
  }

  public async getAssetFileContent(relativePath: string): Promise<string> {
    if (this._assetsBaseUrl.protocol === 'file:') {
      return await fs.readFile(resolve(fileURLToPath(this._assetsBaseUrl), relativePath), 'utf8');
    } else {
      return await this.fetchAssetFile(relativePath);
    }
  }

  public async copyAssetFile(relativePath: string, destDir: string, logName?: string): Promise<void> {
    const targetPath = resolve(destDir, basename(relativePath));
    if (logName !== undefined) {
      if (logName) {
        console.log(`Copying ${logName} to "${targetPath}"`);
      } else {
        console.log(`Copying asset file "${relativePath}" to "${targetPath}"`);
      }
    }
    if (this._assetsBaseUrl.protocol === 'file:') {
      const srcPath = resolve(fileURLToPath(this._assetsBaseUrl), relativePath);
      await fs.copyFile(srcPath, targetPath);
    } else {
      const fileContent = await this.fetchAssetFile(relativePath);
      await fs.outputFile(targetPath, fileContent);
    }
  }

  private async fetchAssetFile(relativePath: string): Promise<string> {
    const url = new URL(relativePath, this._assetsBaseUrl);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch asset file "${relativePath}" from "${url.href}": ${response.statusText} (${response.status})`,
      );
    }
    return await response.text();
  }
}
