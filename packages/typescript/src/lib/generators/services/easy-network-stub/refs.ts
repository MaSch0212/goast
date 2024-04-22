import { join, resolve } from 'path';

import { TypeScriptEasyNetworkStubsGeneratorConfig } from './models';
import { ts } from '../../../ast';

// See packages/typescript/assets/stubs/easy-network-stub for reference
export function getReferenceFactories(options: TypeScriptEasyNetworkStubsGeneratorConfig) {
  const utilsDirPath = resolve(options.outputDir, options.utilsDirPath);
  const easyNetworkStubUtilsPath = join(utilsDirPath, 'easy-network-stub.utils.ts');

  return {
    // easy-network-stub.utils.ts
    easyNetworkStubWrapperOptions: ts.reference.factory('EasyNetworkStubWrapperOptions', easyNetworkStubUtilsPath),
    stubRequestItem: ts.reference.factory('StubRequestItem', easyNetworkStubUtilsPath),
    stubRequestInfo: ts.reference.genericFactory<2>('StubRequestInfo', easyNetworkStubUtilsPath),
    strictRouteResponseCallback: ts.reference.genericFactory<3>(
      'StrictRouteResponseCallback',
      easyNetworkStubUtilsPath,
    ),
    getStubResponder: ts.reference.genericFactory<1>('getStubResponder', easyNetworkStubUtilsPath),
    easyNetworkStubWrapper: ts.reference.factory('EasyNetworkStubWrapper', easyNetworkStubUtilsPath),
    easyNetworkStubBase: ts.reference.factory('EasyNetworkStubBase', easyNetworkStubUtilsPath),
    easyNetworkStubGroup: ts.reference.genericFactory<2>('EasyNetworkStubGroup', easyNetworkStubUtilsPath),
    createEasyNetworkStubGroup: ts.reference.genericFactory<2>('createEasyNetworkStubGroup', easyNetworkStubUtilsPath),
  };
}
