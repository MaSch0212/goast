import type { OpenApiDocument, OpenApiTag } from '../parse/openapi-types.ts';
import type { Deref } from '../parse/types.ts';
import type { ApiService } from './api-types.ts';
import { getOpenApiObjectIdentifier } from './helpers.ts';
import type { OpenApiTransformerContext } from './types.ts';

/**
 * Transforms the top-level `tags` of an OpenAPI document into services. Each tag becomes a service named after it,
 * keeping the tag's `description`. Operations are attached to these services later, by tag name, in
 * `transformEndpoint`.
 * @param context The transformer context that collects the services.
 * @param document The document whose tags are transformed.
 */
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
