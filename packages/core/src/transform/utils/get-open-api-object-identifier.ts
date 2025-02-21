import type { OpenApiObject } from '../../parse/openapi-types.ts';
import type { Deref } from '../../parse/types.ts';

export function getOpenApiObjectIdentifier(obj: Deref<OpenApiObject<string>>) {
  return obj.$src.file + '#' + obj.$src.path;
}
