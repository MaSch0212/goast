import { resolve } from 'path';

import { TypeScriptFetchClientsGeneratorConfig } from './models';
import { ts } from '../../../ast';

// See packages/typescript/assets/client/fetch for reference
export function getReferenceFactories(options: TypeScriptFetchClientsGeneratorConfig) {
  const utilsDirPath = resolve(options.outputDir, options.utilsDir);
  const fetchClientUtilsPath = resolve(utilsDirPath, 'fetch-client.utils.ts');

  return {
    // fetch-client.utils.ts
    typedResponse: ts.reference.genericFactory<1>('TypedResponse', fetchClientUtilsPath, { importType: 'type-import' }),
    fetchClientOptions: ts.reference.factory('FetchClientOptions', fetchClientUtilsPath, { importType: 'type-import' }),
    urlBuilder: ts.reference.factory('UrlBuilder', fetchClientUtilsPath),
  };
}
