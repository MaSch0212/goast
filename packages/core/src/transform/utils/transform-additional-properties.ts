import { isNullish } from '../../utils/common.utils.ts';
import type { ApiSchema } from '../api-types.ts';
import type { OpenApiTransformerContext } from '../types.ts';

export function transformAdditionalProperties<TAdditionalProperties>(
  context: OpenApiTransformerContext,
  schema: {
    additionalProperties?: TAdditionalProperties;
  },
  transformSchema: (
    context: OpenApiTransformerContext,
    schema: Exclude<TAdditionalProperties, undefined | boolean>,
  ) => ApiSchema,
): boolean | ApiSchema | undefined {
  if (isNullish(schema.additionalProperties)) return undefined;
  if (typeof schema.additionalProperties === 'boolean') return schema.additionalProperties;
  return transformSchema(context, schema.additionalProperties as Exclude<TAdditionalProperties, undefined | boolean>);
}
