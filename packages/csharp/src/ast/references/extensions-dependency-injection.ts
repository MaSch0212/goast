import { csReference, type CsReferenceFactory } from '../nodes/reference.ts';

// Microsoft.Extensions.DependencyInjection
export const iServiceCollection: CsReferenceFactory = csReference.factory(
  'IServiceCollection',
  'Microsoft.Extensions.DependencyInjection',
);
export const iHttpClientBuilder: CsReferenceFactory = csReference.factory(
  'IHttpClientBuilder',
  'Microsoft.Extensions.DependencyInjection',
);
export const serviceCollectionServiceExtensions: CsReferenceFactory = csReference.factory(
  'ServiceCollectionServiceExtensions',
  'Microsoft.Extensions.DependencyInjection',
);
