import { type CsGenericReferenceFactory, csReference, type CsReferenceFactory } from '../nodes/reference.ts';

// FastEndpoints
export const endpoint: CsGenericReferenceFactory<[1, 2]> = csReference.genericFactory<[1, 2]>(
  'Endpoint',
  'FastEndpoints',
);
export const endpointWithoutRequest: CsGenericReferenceFactory<[0, 1]> = csReference.genericFactory<[0, 1]>(
  'EndpointWithoutRequest',
  'FastEndpoints',
);
export const bindFrom: CsReferenceFactory = csReference.factory('BindFrom', 'FastEndpoints');
export const routeParam: CsReferenceFactory = csReference.factory('RouteParam', 'FastEndpoints');
export const queryParam: CsReferenceFactory = csReference.factory('QueryParam', 'FastEndpoints');
export const fromHeader: CsReferenceFactory = csReference.factory('FromHeader', 'FastEndpoints');
