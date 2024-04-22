import { resolve } from 'path';

import { TypeScriptFetchClientsGeneratorConfig } from './models';
import { ts } from '../../../ast';

// See packages/typescript/assets/client/fetch for reference
export function getReferenceFactories(options: TypeScriptFetchClientsGeneratorConfig) {
  const utilsDirPath = resolve(options.outputDir, options.utilsDirPath);
  const fetchClientUtilsPath = resolve(utilsDirPath, 'fetch-client.utils.ts');

  return {
    // fetch-client.utils.ts
    typedResponse: ts.reference.genericFactory<1>('TypedResponse', fetchClientUtilsPath),
    fetchClientOptions: ts.reference.factory('FetchClientOptions', fetchClientUtilsPath),
    urlBuilder: ts.reference.factory('UrlBuilder', fetchClientUtilsPath),
  };
}
