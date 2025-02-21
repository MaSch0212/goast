import type { ApiSchemaAccessibility } from '../api-types.ts';
import { determineSchemaAccessibility } from './determine-schema-accessibility.ts';

export function updateSchemaAccessibility(
  accessibility: ApiSchemaAccessibility,
  schema: {
    readOnly?: boolean;
    writeOnly?: boolean;
  },
): ApiSchemaAccessibility {
  if (accessibility === 'none') return 'none';
  if (accessibility === 'readOnly') return schema.writeOnly === true ? 'none' : 'readOnly';
  if (accessibility === 'writeOnly') return schema.readOnly === true ? 'none' : 'writeOnly';
  return determineSchemaAccessibility(schema);
}
