import { dirname, relative } from 'node:path';
import process from 'node:process';
import { ApiComponent, ApiData } from '../transform/api-types.ts';

const DOCUMENTS_BASE_PATH = Symbol('documentsBasePath');

export function getSourceDisplayName(data: ApiData, component: ApiComponent<any>) {
  let basePath: string | undefined = (data as any)[DOCUMENTS_BASE_PATH];
  if (basePath === undefined) {
    const allPaths = data.documents.map((doc) => doc.$src.file);
    basePath = getCommonBasePath(allPaths);
    (data as any)[DOCUMENTS_BASE_PATH] = basePath;
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
