import type { ApiSchema, ApiSchemaProperty } from '@goast/core';

/**
 * Arguments of `getFileContent`, which builds the content of a model file. The method takes no arguments beyond its
 * context, so this type has no properties.
 */
export type GetFileContent = object;

/**
 * Arguments of `getSchemaDeclarations`, which declare a normalized schema as an enum, a named type or a struct.
 */
export type GetSchemaDeclarations = {
  /**
   * The normalized schema to declare.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getStruct`, which declares an object schema as a struct.
 */
export type GetStruct = {
  /**
   * The object schema to declare as a struct. Its properties become the fields.
   */
  schema: ApiSchema<'object'>;
};

/**
 * Arguments of `getStructFields`, which determines the fields of a struct.
 */
export type GetStructFields = {
  /**
   * The object schema whose properties become the fields.
   */
  schema: ApiSchema<'object'>;
};

/**
 * Arguments of `hasAdditionalProperties`, which checks whether a struct needs a field for the properties it does not
 * declare.
 */
export type HasAdditionalProperties = {
  /**
   * The object schema to check.
   */
  schema: ApiSchema<'object'>;
};

/**
 * Arguments of `getStructField`, which builds the field of one property in a struct.
 */
export type GetStructField = {
  /**
   * The object schema that declares the property.
   */
  schema: ApiSchema<'object'>;
  /**
   * The property the field holds.
   */
  property: ApiSchemaProperty;
  /**
   * The exported name of the field, which is already unique within the struct.
   */
  fieldName: string;
};

/**
 * Arguments of `getFieldType`, which determines the Go type of the field for a property.
 */
export type GetFieldType = {
  /**
   * The object schema that declares the property.
   */
  schema: ApiSchema<'object'>;
  /**
   * The property whose field type to determine.
   */
  property: ApiSchemaProperty;
};

/**
 * Arguments of `getJsonTag`, which builds the `json` struct tag of the field for a property.
 */
export type GetJsonTag = {
  /**
   * The object schema that declares the property, which decides whether the property is required.
   */
  schema: ApiSchema<'object'>;
  /**
   * The property to build the tag for.
   */
  property: ApiSchemaProperty;
};

/**
 * Arguments of `getAdditionalPropertiesField`, which builds the field that holds the additional properties of a struct.
 */
export type GetAdditionalPropertiesField = {
  /**
   * The object schema that allows additional properties.
   */
  schema: ApiSchema<'object'>;
};

/**
 * Arguments of `getAdditionalPropertiesMethods`, which builds the `MarshalJSON` and `UnmarshalJSON` methods of a struct
 * with additional properties.
 */
export type GetAdditionalPropertiesMethods = {
  /**
   * The object schema that allows additional properties.
   */
  schema: ApiSchema<'object'>;
  /**
   * The name of the struct type the methods are declared on.
   */
  typeName: string;
  /**
   * The exported names of the fields of the struct, in declaration order.
   */
  fieldNames: string[];
};

/**
 * Arguments of `getEnum`, which declares an enum schema as a named type with constants.
 */
export type GetEnum = {
  /**
   * The schema with a non-empty `enum` list to declare.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getEnumUnderlyingType`, which determines the Go type an enum type is based on.
 */
export type GetEnumUnderlyingType = {
  /**
   * The schema whose enum values determine the underlying type.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getEnumValueNames`, which names the constants of an enum type.
 */
export type GetEnumValueNames = {
  /**
   * The schema the values belong to.
   */
  schema: ApiSchema;
  /**
   * The name of the enum type, which prefixes the name of every constant.
   */
  typeName: string;
  /**
   * The enum values to name.
   */
  values: unknown[];
};

/**
 * Arguments of `getEnumValueLiteral`, which renders an enum value as a Go literal.
 */
export type GetEnumValueLiteral = {
  /**
   * The schema the value belongs to, which decides the underlying type of the literal.
   */
  schema: ApiSchema;
  /**
   * The enum value to render.
   */
  value: unknown;
};

/**
 * Arguments of `getEnumValidationMethod`, which builds the `IsValid` method of an enum type.
 */
export type GetEnumValidationMethod = {
  /**
   * The schema the enum belongs to.
   */
  schema: ApiSchema;
  /**
   * The name of the enum type the method is declared on.
   */
  typeName: string;
  /**
   * The names of the enum constants the method compares the value against.
   */
  valueNames: string[];
};

/**
 * Arguments of `getSchemaDoc`, which builds the doc comment of a declaration.
 */
export type GetSchemaDoc = {
  /**
   * The schema whose description is used in the doc comment.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getType`, which maps a schema to the Go type used to refer to it.
 */
export type GetType = {
  /**
   * The schema to map to a Go type.
   */
  schema: ApiSchema;
  /**
   * Whether the type is for the declaration of the schema itself, so it must not refer to that declaration.
   */
  declaration?: boolean;
};

/**
 * Arguments of `getGeneratedType`, which looks up the declared type for a schema that has one.
 */
export type GetGeneratedType = {
  /**
   * The schema to look up the declared type of.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getAdditionalPropertiesType`, which determines the value type of the additional properties.
 */
export type GetAdditionalPropertiesType = {
  /**
   * The object schema that allows additional properties.
   */
  schema: ApiSchema<'object'>;
};

/**
 * Arguments of `shouldGenerateTypeDeclaration`, which decides whether a schema gets a declaration of its own.
 */
export type ShouldGenerateTypeDeclaration = {
  /**
   * The schema to decide for.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getDeclarationTypeName`, which determines the name of the type declared for a schema.
 */
export type GetDeclarationTypeName = {
  /**
   * The schema to name.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getFileName`, which determines the file name of the declaration of a schema.
 */
export type GetFileName = {
  /**
   * The schema whose declaration is written to the file.
   */
  schema: ApiSchema;
  /**
   * The name of the declared type, from which the file name is derived.
   */
  typeName: string;
};

/**
 * Arguments of `isNullable`, which checks whether a schema accepts `null`.
 */
export type IsNullable = {
  /**
   * The schema to check.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `isRecursiveCollection`, which checks whether a schema is an array or map that contains itself.
 */
export type IsRecursiveCollection = {
  /**
   * The schema to check.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `isRecursiveReference`, which checks whether a schema can contain the target schema directly.
 */
export type IsRecursiveReference = {
  /**
   * The schema to start the search from.
   */
  schema: ApiSchema;
  /**
   * The schema the search looks for.
   */
  target: ApiSchema;
};

/**
 * Arguments of `normalizeSchema`, which resolves a schema into the form that is declared.
 */
export type NormalizeSchema = {
  /**
   * The schema to normalize.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `normalizeDiscriminatedBases`, which rewrites the discriminated bases a schema composes.
 */
export type NormalizeDiscriminatedBases = {
  /**
   * The schema that may compose discriminated `oneOf` bases.
   */
  schema: ApiSchema;
};
