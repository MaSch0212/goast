import { join, resolve } from 'node:path';

import type { TypeScriptK6ClientsGeneratorConfig } from './models.ts';
import { ts } from '../../../ast/index.ts';

export function getReferenceFactories(options: TypeScriptK6ClientsGeneratorConfig) {
  const utilsDirPath = resolve(options.outputDir, options.utilsDir);
  return {
    requestBuilder: ts.reference.factory('RequestBuilder', join(utilsDirPath, 'request-builder.js')),
    httpStatusCode: ts.reference.factory('HttpStatusCode', join(utilsDirPath, 'http-status-code.ts')),
  };
}
