import { join, resolve } from 'path';

import { TypeScriptK6ClientsGeneratorConfig } from './models';
import { ts } from '../../../ast';

export function getReferenceFactories(options: TypeScriptK6ClientsGeneratorConfig) {
  const utilsDirPath = resolve(options.outputDir, options.utilsDir);
  return {
    requestBuilder: ts.reference.factory('RequestBuilder', join(utilsDirPath, 'request-builder.js')),
    httpStatusCode: ts.reference.factory('HttpStatusCode', join(utilsDirPath, 'http-status-code.ts')),
  };
}
