import type { ApiSchema, ApiSchemaProperty } from '@goast/core';

export type GetFileContent = object;

export type GetSchemaDeclaration = {
  schema: ApiSchema;
};

export type GetClass = {
  schema: ApiSchema<'object'>;
};

export type GetInterface = {
  schema: ApiSchema<'object'>;
};

export type GetEnum = {
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

export type GetClassParameter = {
  schema: ApiSchema<'object'>;
  inheritedSchemas: ApiSchema[];
  parameters: ApiSchemaProperty[];
  property: ApiSchemaProperty;
};

export type GetInterfaceProperty = {
  schema: ApiSchema<'object'>;
  property: ApiSchemaProperty;
};

export type GetAdditionalPropertiesProperty = {
  schema: ApiSchema<'object'>;
};

export type GetAdditionalPropertiesSetter = {
  schema: ApiSchema<'object'>;
};

export type GetAdditionalPropertiesGetter = {
  schema: ApiSchema<'object'>;
};

export type GetJacksonJsonTypeInfoAnnotation = {
  schema: ApiSchema;
};

export type GetJacksonJsonSubTypesAnnotation = {
  schema: ApiSchema;
};

export type GetJacksonJsonPropertyAnnotation = {
  schema: ApiSchema;
  property: ApiSchemaProperty;
};

export type GetJacksonJsonIncludeAnnotation = {
  schema: ApiSchema;
  property: ApiSchemaProperty;
};

export type GetJakartaValidationAnnotations = {
  schema: ApiSchema;
  property: ApiSchemaProperty;
};

export type GetSwaggerSchemaAnnotation = {
  schema: ApiSchema;
  property: ApiSchemaProperty;
};

export type GetPackageName = {
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

export type GetClassProperties = {
  schema: ApiSchema<'object'>;
};

export type SortProperties = {
  schema: ApiSchema;
  properties: Iterable<ApiSchemaProperty>;
};

export type NormalizeSchema = {
  schema: ApiSchema;
};

export type HasProperty = {
  schema: ApiSchema;
  propertyName: string;
};
