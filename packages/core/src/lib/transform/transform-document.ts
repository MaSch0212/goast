import { ApiService } from './api-types';
import { getOpenApiObjectIdentifier } from './helpers';
import { OpenApiTransformerContext } from './types';
import { Deref, OpenApiDocument, OpenApiTag } from '../parse';

export function transformDocument(context: OpenApiTransformerContext, document: Deref<OpenApiDocument>) {
  for (const tag of document.tags ?? []) {
    transformTag(context, tag);
  }
}

function transformTag(context: OpenApiTransformerContext, tag: Deref<OpenApiTag>, isReference = false) {
  const openApiObjectId = getOpenApiObjectIdentifier(tag);
  const existing = context.transformed.services.get(openApiObjectId);
  if (existing) return existing;

  const ref = tag.$ref ? transformTag(context, tag.$ref, true) : undefined;
  const id = context.idGenerator.generateId('service');
  const service: ApiService = {
    $src: {
      ...tag.$src,
      component: tag,
    },
    $ref: ref,
    id,
    name: tag.name ?? id,
    description: tag.description,
    endpoints: [],
  };

  context.transformed.services.set(openApiObjectId, service);
  if (!isReference) context.services.set(service.name, service);
  return service;
}
