import { type CsGenericReferenceFactory, csReference, type CsReferenceFactory } from '../nodes/reference.ts';

// System.Text.Json
export const jsonSerializer: CsReferenceFactory = csReference.factory('JsonSerializer', 'System.Text.Json');
export const jsonSerializerOptions: CsReferenceFactory = csReference.factory(
  'JsonSerializerOptions',
  'System.Text.Json',
);
export const jsonElement: CsReferenceFactory = csReference.factory('JsonElement', 'System.Text.Json');
export const jsonSerializerDefaults: CsReferenceFactory = csReference.factory(
  'JsonSerializerDefaults',
  'System.Text.Json',
);
export const jsonException: CsReferenceFactory = csReference.factory('JsonException', 'System.Text.Json');
export const jsonNamingPolicy: CsReferenceFactory = csReference.factory('JsonNamingPolicy', 'System.Text.Json');

// System.Text.Json.Serialization
export const jsonPropertyName: CsReferenceFactory = csReference.factory(
  'JsonPropertyName',
  'System.Text.Json.Serialization',
);
export const jsonIgnore: CsReferenceFactory = csReference.factory('JsonIgnore', 'System.Text.Json.Serialization');
export const jsonIgnoreCondition: CsReferenceFactory = csReference.factory(
  'JsonIgnoreCondition',
  'System.Text.Json.Serialization',
);
export const jsonPolymorphic: CsReferenceFactory = csReference.factory(
  'JsonPolymorphic',
  'System.Text.Json.Serialization',
);
export const jsonDerivedType: CsReferenceFactory = csReference.factory(
  'JsonDerivedType',
  'System.Text.Json.Serialization',
);
export const jsonStringEnumConverter: CsGenericReferenceFactory<1> = csReference.genericFactory<1>(
  'JsonStringEnumConverter',
  'System.Text.Json.Serialization',
);
export const jsonStringEnumMemberName: CsReferenceFactory = csReference.factory(
  'JsonStringEnumMemberName',
  'System.Text.Json.Serialization',
);
export const jsonConverter: CsReferenceFactory = csReference.factory('JsonConverter', 'System.Text.Json.Serialization');
export const jsonExtensionData: CsReferenceFactory = csReference.factory(
  'JsonExtensionData',
  'System.Text.Json.Serialization',
);
export const jsonRequired: CsReferenceFactory = csReference.factory('JsonRequired', 'System.Text.Json.Serialization');
export const jsonUnmappedMemberHandling: CsReferenceFactory = csReference.factory(
  'JsonUnmappedMemberHandling',
  'System.Text.Json.Serialization',
);
