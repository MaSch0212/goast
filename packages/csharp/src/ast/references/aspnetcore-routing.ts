import { csReference, type CsReferenceFactory } from '../nodes/reference.ts';

// Microsoft.AspNetCore.Routing
export const iEndpointRouteBuilder: CsReferenceFactory = csReference.factory(
  'IEndpointRouteBuilder',
  'Microsoft.AspNetCore.Routing',
);
export const routeGroupBuilder: CsReferenceFactory = csReference.factory(
  'RouteGroupBuilder',
  'Microsoft.AspNetCore.Routing',
);

// Microsoft.AspNetCore.Builder
export const endpointRouteBuilderExtensions: CsReferenceFactory = csReference.factory(
  'EndpointRouteBuilderExtensions',
  'Microsoft.AspNetCore.Builder',
);
export const routeHandlerBuilder: CsReferenceFactory = csReference.factory(
  'RouteHandlerBuilder',
  'Microsoft.AspNetCore.Builder',
);
export const webApplication: CsReferenceFactory = csReference.factory('WebApplication', 'Microsoft.AspNetCore.Builder');
