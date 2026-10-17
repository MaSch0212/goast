import type { ApiSchema, ApiSchemaProperty } from '@goast/core';

/**
 * Arguments of `getFileContent`. The method takes no arguments beyond its context, so this type has no properties.
 */
export type GetFileContent = object;

/**
 * Arguments of `getSchemaDeclaration`, which writes the declaration of a schema into a model file.
 */
export type GetSchemaDeclaration = {
  /**
   * The normalized schema to declare as a class, interface or enum.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getClass`, which declares an object schema without a discriminator as a Kotlin class.
 */
export type GetClass = {
  /**
   * The object schema to declare as a class. Its properties become the constructor parameters.
   */
  schema: ApiSchema<'object'>;
};

/**
 * Arguments of `getInterface`, which declares a discriminated object schema as a Kotlin interface.
 */
export type GetInterface = {
  /**
   * The discriminated object schema to declare as an interface. Its properties become interface members.
   */
  schema: ApiSchema<'object'>;
};

/**
 * Arguments of `getEnum`, which declares a string enum schema as a Kotlin enum class.
 */
export type GetEnum = {
  /**
   * The schema with a non-empty `enum` list to declare as an enum class.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getSchemaDocDescription`, which builds the text of the doc comment of a schema or property.
 */
export type GetSchemaDocDescription = {
  /**
   * The schema whose description is used. Its source location is added when `includeSourceInDocs` is set.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getType`, which maps a schema to the Kotlin type used to reference it.
 */
export type GetType = {
  /**
   * The schema to map to a Kotlin type.
   */
  schema: ApiSchema;
  /**
   * Whether the type is nullable. When omitted, the schema's own `nullable` flag decides.
   */
  nullable?: boolean;
};

/**
 * Arguments of `getGeneratedType`, which looks up the type of a schema that has its own generated declaration.
 */
export type GetGeneratedType = {
  /**
   * The schema to look up. A reference to another schema is resolved to the schema it points to first.
   */
  schema: ApiSchema;
  /**
   * Whether the reference is nullable. When omitted, the schema's own `nullable` flag decides.
   */
  nullable?: boolean;
};

/**
 * Arguments of `getAdditionalPropertiesType`, which resolves the value type of an object's `additionalProperties`.
 */
export type GetAdditionalPropertiesType = {
  /**
   * The object schema whose `additionalProperties` value type is resolved. A nullable `Any` is used when the
   * value is not a schema.
   */
  schema: ApiSchema<'object'>;
};

/**
 * Arguments of `getDefaultValue`, which renders the `default` of a schema as a Kotlin expression.
 */
export type GetDefaultValue = {
  /**
   * The schema whose `default` value is rendered. A missing default is rendered as `null`.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getClassParameter`, which declares one property as a constructor parameter of a class.
 */
export type GetClassParameter = {
  /**
   * The object schema that declares the class. Its `required` set decides whether the parameter is nullable.
   */
  schema: ApiSchema<'object'>;
  /**
   * The schemas the class inherits from. A parameter that one of them also declares is marked as an override.
   */
  inheritedSchemas: ApiSchema[];
  /**
   * All constructor parameters of the class, in the order they are written.
   */
  parameters: ApiSchemaProperty[];
  /**
   * The property to declare as the constructor parameter.
   */
  property: ApiSchemaProperty;
};

/**
 * Arguments of `getInterfaceProperty`, which declares one property as a member of an interface.
 */
export type GetInterfaceProperty = {
  /**
   * The discriminated object schema that declares the interface. Its `required` set decides whether the property
   * is nullable.
   */
  schema: ApiSchema<'object'>;
  /**
   * The property to declare as an interface member.
   */
  property: ApiSchemaProperty;
};

/**
 * Arguments of `getAdditionalPropertiesProperty`, which declares the `additionalProperties` map of a class.
 */
export type GetAdditionalPropertiesProperty = {
  /**
   * The object schema whose `additionalProperties` are declared as a mutable map.
   */
  schema: ApiSchema<'object'>;
};

/**
 * Arguments of `getAdditionalPropertiesSetter`, which declares the `set` function that stores an additional property.
 */
export type GetAdditionalPropertiesSetter = {
  /**
   * The object schema whose `additionalProperties` the setter writes to.
   */
  schema: ApiSchema<'object'>;
};

/**
 * Arguments of `getAdditionalPropertiesGetter`, which declares the `getMap` function that returns the additional
 * properties.
 */
export type GetAdditionalPropertiesGetter = {
  /**
   * The object schema whose `additionalProperties` the getter returns.
   */
  schema: ApiSchema<'object'>;
};

/**
 * Arguments of `getJacksonJsonTypeInfoAnnotation`, which builds the `@JsonTypeInfo` annotation of an interface.
 */
export type GetJacksonJsonTypeInfoAnnotation = {
  /**
   * The schema whose `discriminator` names the property that selects the subtype.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getJacksonJsonSubTypesAnnotation`, which builds the `@JsonSubTypes` annotation of an interface.
 */
export type GetJacksonJsonSubTypesAnnotation = {
  /**
   * The discriminated schema whose `discriminator.mapping` entries are listed as subtypes.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getJacksonJsonClassDescriptionAnnotation`, which builds the `@JsonClassDescription` annotation.
 */
export type GetJacksonJsonClassDescriptionAnnotation = {
  /**
   * The schema whose `description` is written into the annotation.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getJacksonJsonPropertyAnnotation`, which builds the `@JsonProperty` annotation of a property.
 */
export type GetJacksonJsonPropertyAnnotation = {
  /**
   * The schema that declares the property. Its `required` set adds `required = true` to the annotation.
   */
  schema: ApiSchema;
  /**
   * The property whose name is written into the annotation.
   */
  property: ApiSchemaProperty;
};

/**
 * Arguments of `getJacksonJsonPropertyDescriptionAnnotation`, which builds the `@JsonPropertyDescription` annotation.
 */
export type GetJacksonJsonPropertyDescriptionAnnotation = {
  /**
   * The schema that declares the property. The default implementation does not read it.
   */
  schema: ApiSchema;
  /**
   * The property whose `description` is written into the annotation.
   */
  property: ApiSchemaProperty;
};

/**
 * Arguments of `getJacksonJsonIncludeAnnotation`, which builds the `@JsonInclude` annotation of a property.
 */
export type GetJacksonJsonIncludeAnnotation = {
  /**
   * The schema that declares the property. The default implementation does not read it.
   */
  schema: ApiSchema;
  /**
   * The property whose `exclude-when-null` custom flag selects `@JsonInclude(NON_NULL)`.
   */
  property: ApiSchemaProperty;
};

/**
 * Arguments of `getJakartaValidationAnnotations`, which builds the Jakarta Validation annotations of a property.
 */
export type GetJakartaValidationAnnotations = {
  /**
   * The schema that declares the property. The default implementation does not read it.
   */
  schema: ApiSchema;
  /**
   * The property whose constraints (pattern, length, size and range) and generated type determine the annotations.
   */
  property: ApiSchemaProperty;
};

/**
 * Arguments of `getSwaggerSchemaAnnotation`, which builds the Swagger `@Schema` annotation of a property.
 */
export type GetSwaggerSchemaAnnotation = {
  /**
   * The schema that declares the property. Its `required` set adds `required = true` to the annotation.
   */
  schema: ApiSchema;
  /**
   * The property whose example, description and deprecation flag are written into the annotation.
   */
  property: ApiSchemaProperty;
};

/**
 * Arguments of `getPackageName`, which resolves the package the model of a schema is generated in.
 */
export type GetPackageName = {
  /**
   * The schema whose package is resolved. It is passed to `packageSuffix` when that option is a function.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `shouldGenerateTypeDeclaration`, which decides whether a schema gets its own declaration and file.
 */
export type ShouldGenerateTypeDeclaration = {
  /**
   * The schema to check. Enum schemas always get a declaration, and primitive schemas never do.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getDeclarationTypeName`, which derives the Kotlin type name of a schema.
 */
export type GetDeclarationTypeName = {
  /**
   * The schema whose `name` is converted with the `typeNameCasing` option.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getInheritedSchemas`, which collects the schemas a class inherits from.
 */
export type GetInheritedSchemas = {
  /**
   * The schema whose inherited schemas are collected. Only those that get their own named declaration are kept.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `getClassProperties`, which collects the constructor parameters of a class.
 */
export type GetClassProperties = {
  /**
   * The object schema whose properties are collected. A discriminator property that the mapping of an inherited
   * schema fixes to this schema gets that value as its default and is moved to the end.
   */
  schema: ApiSchema<'object'>;
};

/**
 * Arguments of `sortProperties`, which orders the properties of a class or interface.
 */
export type SortProperties = {
  /**
   * The schema whose `required` set and defaults determine the order.
   */
  schema: ApiSchema;
  /**
   * The properties to sort. The iterable is copied, so it is not modified.
   */
  properties: Iterable<ApiSchemaProperty>;
};

/**
 * Arguments of `normalizeSchema`, which turns a schema into the form that is declared.
 */
export type NormalizeSchema = {
  /**
   * The schema to normalize. A `oneOf` is turned into `anyOf` or `allOf` according to `oneOfBehavior`, and object
   * compositions are merged into one object where possible.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `normalizeDiscriminatedBases`, which rewrites discriminated `oneOf` bases into objects.
 */
export type NormalizeDiscriminatedBases = {
  /**
   * The schema whose compositions are searched for discriminated `oneOf` bases to rewrite.
   */
  schema: ApiSchema;
};

/**
 * Arguments of `hasProperty`, which checks whether a schema declares a property, directly or through its compositions.
 */
export type HasProperty = {
  /**
   * The schema to search, including the schemas it composes with `allOf`, `anyOf` and undiscriminated `oneOf`.
   */
  schema: ApiSchema;
  /**
   * The name of the property to look for.
   */
  propertyName: string;
  /** The schemas already inspected, so a composition that cycles back on itself terminates. */
  visited?: Set<ApiSchema>;
};
