import { join, resolve } from 'node:path';

import { ts } from '../../../ast/index.ts';
import type { TypeScriptEasyNetworkStubsGeneratorConfig } from './models.ts';

/**
 * Creates the references to the utilities that the generated stubs import from the `utils` directory.
 * `TypeScriptEasyNetworkStubsGenerator` copies these utilities to `{outputDir}/{utilsDir}`.
 * @param options The configuration of the stubs generator, which provides `outputDir` and `utilsDir`.
 * @returns The reference factories for the members of `easy-network-stub.utils.ts`, and for `StubHandle`, which is
 * imported from the `easy-network-stub` module.
 */
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
  stubHandle: ts.ModuleReferenceFactory;
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
    stubHandle: ts.reference.factory('StubHandle', 'easy-network-stub', { importType: 'type-import' }),
  };
}
