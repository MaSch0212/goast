import { join, resolve } from 'node:path';

import { ts } from '../../../ast/index.ts';
import type { TypeScriptK6ClientsGeneratorConfig } from './models.ts';

/**
 * Creates the references to the utilities that the generated k6 clients import from the `utils` directory.
 * `TypeScriptK6ClientsGenerator` copies the request builder there, and generates `http-status-code.ts` when
 * `strictResponseTypes` is disabled.
 * @param options The configuration of the k6 clients generator, which provides `outputDir`, `utilsDir` and `language`.
 * @returns The reference factories for `RequestBuilder` (`request-builder.js` or `.ts`, depending on `language`) and
 * for `HttpStatusCode` (`http-status-code.ts`).
 */
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
