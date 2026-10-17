import type { ApiSchema, ApiSchemaProperty } from '@goast/core';

export type GetFileContent = object;

export type GetSchemaDeclaration = {
  schema: ApiSchema;
};

export type GetRecord = {
  schema: ApiSchema<'object'>;
};

export type GetEnum = {
  schema: ApiSchema;
};

export type GetSchemaDocDescription = {
  schema: ApiSchema;
};

export type GetType = {
  schema: ApiSchema;
  nullable?: boolean;
};

export type GetGeneratedType = {
  schema: ApiSchema;
  nullable?: boolean;
};

export type GetAdditionalPropertiesType = {
  schema: ApiSchema<'object'>;
};

export type GetDefaultValue = {
  schema: ApiSchema;
};

export type GetPropertyNames = {
  schema: ApiSchema<'object'>;
  properties: ApiSchemaProperty[];
};

export type GetPropertyName = {
  schema: ApiSchema<'object'>;
  property: ApiSchemaProperty;
};

export type GetRecordProperty = {
  schema: ApiSchema<'object'>;
  property: ApiSchemaProperty;
  /** The C# name the property is declared with. */
  name: string;
};

export type GetAdditionalPropertiesProperty = {
  schema: ApiSchema<'object'>;
  /** The C# name of the property. */
  name: string;
};

export type GetEnumMember = {
  schema: ApiSchema;
  /** The raw value of the enum member. */
  value: unknown;
  /** The C# name of the enum member. */
  name: string;
};

export type GetEnumUnderlyingType = {
  schema: ApiSchema;
};

export type GetJsonPropertyNameAttribute = {
  schema: ApiSchema;
  property: ApiSchemaProperty;
};

export type GetJsonIgnoreAttribute = {
  schema: ApiSchema;
  property: ApiSchemaProperty;
};

export type GetJsonPolymorphicAttribute = {
  schema: ApiSchema;
};

export type GetJsonDerivedTypeAttributes = {
  schema: ApiSchema;
};

export type GetJsonEnumAttributes = {
  schema: ApiSchema;
};

export type GetObsoleteAttribute = {
  schema: ApiSchema;
};

export type GetDataAnnotationAttributes = {
  schema: ApiSchema;
  property: ApiSchemaProperty;
};

export type GetNamespace = {
  schema: ApiSchema;
};

export type ShouldGenerateTypeDeclaration = {
  schema: ApiSchema;
};

export type GetDeclarationTypeName = {
  schema: ApiSchema;
};

export type GetInheritedSchemas = {
  schema: ApiSchema;
};

export type GetBaseSchema = {
  schema: ApiSchema;
};

export type GetRecordProperties = {
  schema: ApiSchema<'object'>;
};

export type SortProperties = {
  schema: ApiSchema;
  properties: Iterable<ApiSchemaProperty>;
};

export type NormalizeSchema = {
  schema: ApiSchema;
};

export type NormalizeDiscriminatedBases = {
  schema: ApiSchema;
};

export type HasProperty = {
  schema: ApiSchema;
  propertyName: string;
  /** The schemas already inspected, so a composition that cycles back on itself terminates. */
  visited?: Set<ApiSchema>;
};

export type ReferencesDeprecatedType = {
  schema: ApiSchema<'object'>;
};
