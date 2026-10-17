import type { ApiSchema, ApiSchemaProperty } from '@goast/core';

export type GetFileContent = object;

export type GetSchemaDeclarations = {
  schema: ApiSchema;
};

export type GetStruct = {
  schema: ApiSchema<'object'>;
};

export type GetStructFields = {
  schema: ApiSchema<'object'>;
};

export type HasAdditionalProperties = {
  schema: ApiSchema<'object'>;
};

export type GetStructField = {
  schema: ApiSchema<'object'>;
  property: ApiSchemaProperty;
  fieldName: string;
};

export type GetFieldType = {
  schema: ApiSchema<'object'>;
  property: ApiSchemaProperty;
};

export type GetJsonTag = {
  schema: ApiSchema<'object'>;
  property: ApiSchemaProperty;
};

export type GetAdditionalPropertiesField = {
  schema: ApiSchema<'object'>;
};

export type GetAdditionalPropertiesMethods = {
  schema: ApiSchema<'object'>;
  typeName: string;
  fieldNames: string[];
};

export type GetEnum = {
  schema: ApiSchema;
};

export type GetEnumUnderlyingType = {
  schema: ApiSchema;
};

export type GetEnumValueNames = {
  schema: ApiSchema;
  typeName: string;
  values: unknown[];
};

export type GetEnumValueLiteral = {
  schema: ApiSchema;
  value: unknown;
};

export type GetEnumValidationMethod = {
  schema: ApiSchema;
  typeName: string;
  valueNames: string[];
};

export type GetSchemaDoc = {
  schema: ApiSchema;
};

export type GetType = {
  schema: ApiSchema;
  /** Whether the type is for the declaration of the schema itself, so it must not refer to that declaration. */
  declaration?: boolean;
};

export type GetGeneratedType = {
  schema: ApiSchema;
};

export type GetAdditionalPropertiesType = {
  schema: ApiSchema<'object'>;
};

export type ShouldGenerateTypeDeclaration = {
  schema: ApiSchema;
};

export type GetDeclarationTypeName = {
  schema: ApiSchema;
};

export type GetFileName = {
  schema: ApiSchema;
  typeName: string;
};

export type IsNullable = {
  schema: ApiSchema;
};

export type IsRecursiveCollection = {
  schema: ApiSchema;
};

export type IsRecursiveReference = {
  schema: ApiSchema;
  target: ApiSchema;
};

export type NormalizeSchema = {
  schema: ApiSchema;
};

export type NormalizeDiscriminatedBases = {
  schema: ApiSchema;
};
