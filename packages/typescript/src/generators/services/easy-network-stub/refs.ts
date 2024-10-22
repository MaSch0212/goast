import { join, resolve } from 'node:path';

import { ts } from '../../../ast/index.ts';
import type { TypeScriptEasyNetworkStubsGeneratorConfig } from './models.ts';

// See packages/typescript/assets/stubs/easy-network-stub for reference
export function getReferenceFactories(options: TypeScriptEasyNetworkStubsGeneratorConfig): {
  easyNetworkStubWrapperOptions: ts.ModuleReferenceFactory;
  stubRequestItem: ts.ModuleReferenceFactory;
  stubRequestInfo: ts.GenericModuleReferenceFactory<2>;
  strictRouteResponseCallback: ts.GenericModuleReferenceFactory<3>;
  getStubResponder: ts.GenericModuleReferenceFactory<1>;
  easyNetworkStubWrapper: ts.ModuleReferenceFactory;
  easyNetworkStubBase: ts.ModuleReferenceFactory;
  easyNetworkStubGroup: ts.GenericModuleReferenceFactory<2>;
  createEasyNetworkStubGroup: ts.GenericModuleReferenceFactory<2>;
} {
  const utilsDirPath = resolve(options.outputDir, options.utilsDir);
  const easyNetworkStubUtilsPath = join(utilsDirPath, 'easy-network-stub.utils.ts');

  return {
    // easy-network-stub.utils.ts
    easyNetworkStubWrapperOptions: ts.reference.factory('EasyNetworkStubWrapperOptions', easyNetworkStubUtilsPath, {
      importType: 'type-import',
    }),
    stubRequestItem: ts.reference.factory('StubRequestItem', easyNetworkStubUtilsPath, { importType: 'type-import' }),
    stubRequestInfo: ts.reference.genericFactory<2>('StubRequestInfo', easyNetworkStubUtilsPath, {
      importType: 'type-import',
    }),
    strictRouteResponseCallback: ts.reference.genericFactory<3>(
      'StrictRouteResponseCallback',
      easyNetworkStubUtilsPath,
      {
        importType: 'type-import',
      },
    ),
    getStubResponder: ts.reference.genericFactory<1>('getStubResponder', easyNetworkStubUtilsPath),
    easyNetworkStubWrapper: ts.reference.factory('EasyNetworkStubWrapper', easyNetworkStubUtilsPath),
    easyNetworkStubBase: ts.reference.factory('EasyNetworkStubBase', easyNetworkStubUtilsPath),
    easyNetworkStubGroup: ts.reference.genericFactory<2>('EasyNetworkStubGroup', easyNetworkStubUtilsPath, {
      importType: 'type-import',
    }),
    createEasyNetworkStubGroup: ts.reference.genericFactory<2>('createEasyNetworkStubGroup', easyNetworkStubUtilsPath),
  };
}
