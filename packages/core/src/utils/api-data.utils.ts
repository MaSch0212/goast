import { dirname, relative } from 'node:path';
import process from 'node:process';
import type { ApiComponent, ApiData } from '../transform/api-types.ts';

const DOCUMENTS_BASE_PATH = Symbol('documentsBasePath');

type ApiDataWithBasePath = ApiData & {
  [DOCUMENTS_BASE_PATH]?: string;
};

/**
 * Gets a display name for the source location of a component in the form `<relative file path>#<source path>`. The
 * file path is relative to the common base path of all documents in `data`, which is computed on first use and cached
 * on `data`.
 * @template T The OpenAPI type of the component.
 * @param data The API data that contains the documents of the component.
 * @param component The component to get the display name for.
 * @returns The display name of the component's source location.
 */
export function getSourceDisplayName<T>(data: ApiData, component: ApiComponent<T>): string {
  let basePath: string | undefined = (data as ApiDataWithBasePath)[DOCUMENTS_BASE_PATH];
  if (basePath === undefined) {
    const allPaths = data.documents.map((doc) => doc.$src.file);
    basePath = getCommonBasePath(allPaths);
    (data as ApiDataWithBasePath)[DOCUMENTS_BASE_PATH] = basePath;
  }

  const relativePath = relative(basePath, component.$src.file);
  return `${relativePath}#${component.$src.path}`;
}

function getCommonBasePath(paths: string[]): string {
  if (paths.length === 0) return '';
  if (paths.length === 1) return dirname(paths[0]);

  const splitPaths = paths.map((p) => normalizePath(p).split('/'));
  const minLength = Math.min(...splitPaths.map((parts) => parts.length));
  const commonParts: string[] = [];

  for (let i = 0; i < minLength; i++) {
    const part = splitPaths[0][i];
    if (splitPaths.every((parts) => parts[i] === part)) {
      commonParts.push(part);
    } else {
      break;
    }
  }

  return commonParts.join('/');
}

function normalizePath(path: string): string {
  if (process.platform === 'win32') {
    return path.replace(/\\/g, '/');
  }
  return path;
}
