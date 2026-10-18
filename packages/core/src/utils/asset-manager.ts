import { basename, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import fs from 'fs-extra';

/**
 * Reads and copies asset files, such as templates, that are shipped with a generator package. The assets base URL can
 * be a `file:` URL, in which case files are read from the local file system, or an HTTP(S) URL, in which case files
 * are fetched over the network. Relative paths are resolved against the base URL.
 */
export class AssetManager {
  private readonly _assetsBaseUrl: URL;

  /**
   * Initializes a new instance of the AssetManager class.
   * @param assetsBaseUrl The base URL of the asset directory. Either a `file:` URL or an HTTP(S) URL.
   */
  constructor(assetsBaseUrl: URL) {
    this._assetsBaseUrl = assetsBaseUrl;
  }

  /**
   * Gets the content of an asset file as text. The file is read from disk for `file:` base URLs and fetched for HTTP(S)
   * base URLs. Rejects if the file cannot be read, or if the HTTP response is not successful.
   * @param relativePath The path of the asset file, relative to the assets base URL.
   * @returns The text content of the asset file.
   */
  public async getAssetFileContent(relativePath: string): Promise<string> {
    if (this._assetsBaseUrl.protocol === 'file:') {
      return await fs.readFile(resolve(fileURLToPath(this._assetsBaseUrl), relativePath), 'utf8');
    } else {
      return await this.fetchAssetFile(relativePath);
    }
  }

  /**
   * Copies an asset file into the specified directory under its base name, overwriting any existing file at that path.
   * @param relativePath The path of the asset file, relative to the assets base URL.
   * @param destDir The directory to copy the file into.
   * @param logName The name to show in the log message. Nothing is logged if omitted; an empty string logs the relative
   * path instead.
   */
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
