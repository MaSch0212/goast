import { tsReference } from '../nodes/reference';

export const easyNetworkStub = tsReference.factory('EasyNetworkStub', 'easy-network-stub');
export const httpMethod = tsReference.factory('HttpMethod', 'easy-network-stub', { importType: 'type-import' });
export const routeResponseCallback = tsReference.genericFactory<2>('RouteResponseCallback', 'easy-network-stub', {
  importType: 'type-import',
});
export const errorResponse = tsReference.genericFactory<1>('ErrorResponse', 'easy-network-stub');
