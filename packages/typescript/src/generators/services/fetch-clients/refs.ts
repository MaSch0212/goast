import { resolve } from 'node:path';

import { ts } from '../../../ast/index.ts';
import type { TypeScriptFetchClientsGeneratorConfig } from './models.ts';

/**
 * Creates the references to the utilities that the generated fetch clients import from the `utils` directory.
 * `TypeScriptFetchClientsGenerator` copies these utilities to `{outputDir}/{utilsDir}`.
 * @param options The configuration of the fetch clients generator, which provides `outputDir` and `utilsDir`.
 * @returns The reference factories for `TypedResponse`, `FetchClientOptions` and `UrlBuilder`, all imported from
 * `fetch-client.utils.ts`.
 */
// See packages/typescript/assets/client/fetch for reference
export function getReferenceFactories(options: TypeScriptFetchClientsGeneratorConfig): {
  typedResponse: ts.GenericModuleReferenceFactory<1>;
  fetchClientOptions: ts.ModuleReferenceFactory;
  urlBuilder: ts.ModuleReferenceFactory;
} {
  const utilsDirPath = resolve(options.outputDir, options.utilsDir);
  const fetchClientUtilsPath = resolve(utilsDirPath, 'fetch-client.utils.ts');

  return {
    // fetch-client.utils.ts
    typedResponse: ts.reference.genericFactory<1>('TypedResponse', fetchClientUtilsPath, { importType: 'type-import' }),
    fetchClientOptions: ts.reference.factory('FetchClientOptions', fetchClientUtilsPath, { importType: 'type-import' }),
    urlBuilder: ts.reference.factory('UrlBuilder', fetchClientUtilsPath),
  };
}
