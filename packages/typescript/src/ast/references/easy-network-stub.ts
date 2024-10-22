import {
  type TsGenericModuleReferenceFactory,
  type TsModuleReferenceFactory,
  tsReference,
} from '../nodes/reference.ts';

export const easyNetworkStub: TsModuleReferenceFactory = tsReference.factory('EasyNetworkStub', 'easy-network-stub');
export const httpMethod: TsModuleReferenceFactory = tsReference.factory('HttpMethod', 'easy-network-stub', {
  importType: 'type-import',
});
export const routeResponseCallback: TsGenericModuleReferenceFactory<2> = tsReference.genericFactory<2>(
  'RouteResponseCallback',
  'easy-network-stub',
  {
    importType: 'type-import',
  },
);
export const errorResponse: TsGenericModuleReferenceFactory<1> = tsReference.genericFactory<1>(
  'ErrorResponse',
  'easy-network-stub',
);
