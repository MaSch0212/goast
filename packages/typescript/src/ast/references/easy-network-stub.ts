import {
  type TsGenericModuleReferenceFactory,
  type TsModuleReferenceFactory,
  tsReference,
} from '../nodes/reference.ts';

/** Reference to `EasyNetworkStub` from the `easy-network-stub` module. */
export const easyNetworkStub: TsModuleReferenceFactory = tsReference.factory('EasyNetworkStub', 'easy-network-stub');
/** Reference to `HttpMethod` from the `easy-network-stub` module, imported as a type. */
export const httpMethod: TsModuleReferenceFactory = tsReference.factory('HttpMethod', 'easy-network-stub', {
  importType: 'type-import',
});
/** Type-only reference to `RouteResponseCallback` from the `easy-network-stub` module. Takes two type arguments. */
export const routeResponseCallback: TsGenericModuleReferenceFactory<2> = tsReference.genericFactory<2>(
  'RouteResponseCallback',
  'easy-network-stub',
  {
    importType: 'type-import',
  },
);
/** Reference to `ErrorResponse` from the `easy-network-stub` module. Takes one type argument. */
export const errorResponse: TsGenericModuleReferenceFactory<1> = tsReference.genericFactory<1>(
  'ErrorResponse',
  'easy-network-stub',
);
