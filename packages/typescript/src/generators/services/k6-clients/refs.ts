import { join, resolve } from 'node:path';

import { ts } from '../../../ast/index.ts';
import type { TypeScriptK6ClientsGeneratorConfig } from './models.ts';

export function getReferenceFactories(options: TypeScriptK6ClientsGeneratorConfig): {
  requestBuilder: ts.ModuleReferenceFactory;
  httpStatusCode: ts.ModuleReferenceFactory;
} {
  const utilsDirPath = resolve(options.outputDir, options.utilsDir);
  const ext = options.language === 'javascript' ? '.js' : '.ts';
  return {
    requestBuilder: ts.reference.factory('RequestBuilder', join(utilsDirPath, `request-builder${ext}`)),
    httpStatusCode: ts.reference.factory('HttpStatusCode', join(utilsDirPath, 'http-status-code.ts')),
  };
}
