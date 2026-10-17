import type {
  KnownOpenApiParameterTarget,
  OpenApiDocument,
  OpenApiHeader,
  OpenApiHttpMethod,
  OpenApiMediaType,
  OpenApiOperation,
  OpenApiParameter,
  OpenApiPathItem,
  OpenApiRequestBody,
  OpenApiResponse,
  OpenApiSchema,
  OpenApiTag,
} from '../parse/openapi-types.ts';
import type { Deref, DerefSource } from '../parse/types.ts';
import type { OptionalProperties } from '../utils/type.utils.ts';

/**
 * The normalized result of transforming OpenAPI documents. Every generator works from this model.
 * @see transformOpenApi
 */
export type ApiData = {
  /**
   * The parsed OpenAPI documents that the model was transformed from.
   */
  documents: Deref<OpenApiDocument>[];
  /**
   * The services: one per document tag, plus implicit services for operation tags that no document declares.
   */
  services: ApiService[];
  /**
   * Every operation of every path across all documents.
   */
  endpoints: ApiEndpoint[];
  /**
   * Every schema reached from the documents, including inline and nested schemas.
   */
  schemas: ApiSchema[];
};

/**
 * The source information of a transformed entry: where its OpenAPI object is located, and the object itself.
 * @template T The OpenAPI object type the entry was transformed from.
 */
export type ApiComponentSource<T> = DerefSource<T> & {
  /**
   * The parsed OpenAPI object that the entry was built from.
   */
  component: Deref<T>;
};

/**
 * Maps an OpenAPI object type to the model type it is transformed into, or to `undefined` for types that are not
 * modelled.
 * @template T The OpenAPI object type.
 */
export type Transformed<T> = T extends OpenApiTag
  ? ApiService
  : T extends OpenApiPathItem
    ? ApiPath
    : T extends OpenApiParameter
      ? ApiParameter
      : T extends OpenApiRequestBody
        ? ApiRequestBody
        : T extends OpenApiResponse
          ? ApiResponse
          : T extends OpenApiMediaType
            ? ApiContent
            : T extends OpenApiHeader
              ? ApiHeader
              : T extends OpenApiSchema
                ? ApiSchema
                : undefined;

/**
 * The fields that every model entry originating from an OpenAPI object has.
 * @template T The OpenAPI object type the entry was transformed from.
 */
export type ApiComponent<T> = {
  /**
   * A generated identifier such as `schema-3`. It is unique within one transform run, but it depends on traversal
   * order and is not taken from the spec.
   */
  id: string;
  /**
   * The source location of the OpenAPI object, including the parsed object itself as `component`.
   */
  $src: ApiComponentSource<T>;
  /**
   * The entry that the source object refers to when it is a `$ref`, or `undefined` otherwise. Fields that the
   * referencing object does not set are read from the target, except `title`.
   */
  $ref: Transformed<T> | undefined;
};

/**
 * An HTTP method, in lowercase, as it appears as a key of an OpenAPI path item.
 * @see ApiPath
 */
export type ApiMethod = OpenApiHttpMethod;
/**
 * Where a parameter is sent, taken verbatim from the `in` keyword, such as `path`, `query`, `header` or `cookie`.
 * @see ApiParameter
 */
export type ApiParameterTarget = KnownOpenApiParameterTarget;

/**
 * The component part of an `ApiService`. `$src` is absent for services that were created from operation tags without
 * a matching document tag.
 * @see ApiService
 */
export type ApiServiceComponent = OptionalProperties<ApiComponent<OpenApiTag>, '$src'>;
/**
 * A named group of endpoints, typically one per OpenAPI tag.
 * @see ApiEndpoint
 */
export type ApiService = ApiServiceComponent & {
  /**
   * The name of the service: the tag's `name`, or a generated identifier if the tag has none. Operations without tags
   * are grouped under a generated name.
   */
  name: string;
  /**
   * The `description` of the tag, or `undefined` for a service that was created implicitly.
   */
  description: string | undefined;
  /**
   * The endpoints of this service. An operation with several tags appears in each of their services.
   */
  endpoints: ApiEndpoint[];
};

/**
 * The component fields of an `ApiPath`, built from an OpenAPI path item.
 * @see ApiPath
 */
export type ApiPathComponent = ApiComponent<OpenApiPathItem>;
/**
 * A path template, such as `/pets/{petId}`, with the parameters declared on it. One `ApiPath` is shared by all the
 * operations of that path, which are stored under the method names (`get`, `post`, ...) that the path defines.
 * @see ApiEndpoint
 */
export type ApiPath = ApiPathComponent & {
  /**
   * The `summary` of the path item, or `undefined`.
   */
  summary: string | undefined;
  /**
   * The `description` of the path item, or `undefined`.
   */
  description: string | undefined;
  /**
   * The path template exactly as it is written in the `paths` object.
   */
  path: string;
  /**
   * The parameters declared on the path item. They apply to all its operations. Each endpoint's `parameters` merges
   * them with the operation's own parameters.
   */
  parameters: ApiParameter[];
} & { [K in ApiMethod]: ApiEndpoint | undefined };

/**
 * The component fields of an `ApiEndpoint`, built from an OpenAPI operation. `$ref` is always `undefined`, because
 * operations cannot be referenced.
 * @see ApiEndpoint
 */
export type ApiEndpointComponent = ApiComponent<OpenApiOperation>;
/**
 * A single operation: one HTTP method on one path. Generators turn endpoints into client methods or handlers.
 * @see ApiPath
 */
export type ApiEndpoint = ApiEndpointComponent & {
  /**
   * The `operationId` of the operation if it has one, otherwise a name built from the method and path, such as
   * `get_pets_:id`.
   */
  name: string;
  /**
   * The path template of the operation, such as `/pets/{petId}`.
   */
  path: string;
  /**
   * The path entry this operation belongs to, which also holds the other operations of the same path.
   */
  pathInfo: ApiPath;
  /**
   * The HTTP method of the operation.
   */
  method: ApiMethod;
  /**
   * The `summary` of the operation, or `undefined`.
   */
  summary: string | undefined;
  /**
   * The `description` of the operation, or `undefined`.
   */
  description: string | undefined;
  /**
   * The effective parameters: the path item's parameters merged with the operation's own. An operation parameter
   * replaces a path-level parameter with the same name, matched by name only.
   */
  parameters: ApiParameter[];
  /**
   * Whether the operation is marked `deprecated`. Defaults to `false`.
   */
  deprecated: boolean;
  /**
   * The request body of an OpenAPI 3.x operation, or `undefined`. OpenAPI 2.0 body parameters are not converted into a
   * request body; they stay in `parameters` with the target `body`.
   */
  requestBody: ApiRequestBody | undefined;
  /**
   * The responses of the operation, in the order they appear in the spec.
   */
  responses: ApiResponse[];
  /**
   * The tags of the operation. Empty if it has none.
   */
  tags: string[];
  /**
   * The `x-` extension fields of the operation, keyed without the `x-` prefix.
   */
  custom: Record<string, unknown>;
};

/**
 * The component fields of an `ApiParameter`, built from an OpenAPI parameter object.
 * @see ApiParameter
 */
export type ApiParameterComponent = ApiComponent<OpenApiParameter>;
/**
 * A parameter of an operation or path item, built from an OpenAPI parameter object. Response headers reuse this shape
 * through `ApiHeader`.
 * @see ApiEndpoint
 */
export type ApiParameter = ApiParameterComponent & {
  /**
   * The parameter name, exactly as the spec writes it. Names are case-sensitive.
   */
  name: string;
  /**
   * Where the parameter is sent, taken from the `in` keyword.
   * @see ApiParameterTarget
   */
  target: ApiParameterTarget;
  /**
   * The `description` of the parameter, or `undefined`.
   */
  description: string | undefined;
  /**
   * Whether the parameter is required, from the `required` keyword and defaulting to `false`. Path parameters are not
   * forced to `true`, even though the spec requires them to be required.
   */
  required: boolean;
  /**
   * Whether the parameter is marked `deprecated`. Defaults to `false`.
   */
  deprecated: boolean;
  /**
   * The `allowEmptyValue` keyword as written, or `undefined` if absent. It is not defaulted.
   */
  allowEmptyValue: boolean | undefined;
  /**
   * The serialization `style` as written, such as `form` or `simple`, or `undefined` if absent.
   */
  style: string | undefined;
  /**
   * The `explode` keyword as written, or `undefined` if absent. Its default depends on `style`, which is not applied.
   */
  explode: boolean | undefined;
  /**
   * The `allowReserved` keyword as written, or `undefined` if absent.
   */
  allowReserved: boolean | undefined;
  /**
   * The transformed `schema` of the parameter, or `undefined` if it has none. OpenAPI 2.0 non-body parameters declare
   * their type inline rather than in `schema`, so this is `undefined` for them.
   */
  schema: ApiSchema | undefined;
};

/**
 * The component fields of an `ApiRequestBody`, built from an OpenAPI 3.x request body object.
 * @see ApiRequestBody
 */
export type ApiRequestBodyComponent = ApiComponent<OpenApiRequestBody>;
/**
 * The request body of an operation. OpenAPI 2.0 has no request body object; its body parameter is an `ApiParameter`.
 * @see ApiEndpoint
 */
export type ApiRequestBody = ApiRequestBodyComponent & {
  /**
   * The `description` of the request body, or `undefined`.
   */
  description: string | undefined;
  /**
   * One entry per media type in the `content` map, in the order the spec lists them.
   */
  content: ApiContent[];
  /**
   * Whether the body is required, from the `required` keyword and defaulting to `false`.
   */
  required: boolean;
};

/**
 * The component fields of an `ApiContent`, built from an OpenAPI media type object.
 * @see ApiContent
 */
export type ApiContentComponent = ApiComponent<OpenApiMediaType>;
/**
 * A media type entry of a request body or response, such as `application/json`, with the schema of its payload.
 * @see ApiRequestBody
 * @see ApiResponse
 */
export type ApiContent = ApiContentComponent & {
  /**
   * The media type key from the `content` map, such as `application/json`.
   */
  type: string;
  /**
   * The transformed schema of the payload, or `undefined` if the media type has none.
   */
  schema: ApiSchema | undefined;
};

/**
 * The component fields of an `ApiResponse`, built from an OpenAPI response object.
 * @see ApiResponse
 */
export type ApiExampleComponent = ApiComponent<OpenApiResponse>;
/**
 * A response of an operation, one per key of its `responses` object. The status is kept both as written (`statusKey`)
 * and as a number (`statusCode`).
 * @see ApiEndpoint
 */
export type ApiResponse = ApiExampleComponent & {
  /**
   * The response key exactly as the spec wrote it: an exact code (`'200'`), a range (`'2XX'`), or
   * `'default'`.
   *
   * Kept alongside {@link statusCode} because that field is lossy by construction —
   * `Number(status) || undefined` collapses `default`, every range code and the literal `'0'` into
   * `undefined`. Anything that has to *emit* a status code needs this one.
   */
  statusKey: string;
  /**
   * The numeric status code, or `undefined` if the key is not a plain number: `default`, a range such as `2XX`, or `0`.
   */
  statusCode: number | undefined;
  /**
   * The `description` of the response, or `undefined`.
   */
  description: string | undefined;
  /**
   * The response headers, one entry per header name. OpenAPI 2.0 headers are schema-like objects and are read as such.
   */
  headers: ApiHeader[];
  /**
   * The media types of the response, from its `content` map. OpenAPI 2.0 responses declare their payload schema at
   * response level, which is not read, so this is empty for 2.0 responses.
   */
  contentOptions: ApiContent[];
};

/**
 * The component fields of an `ApiHeader`. Its `$ref` points to the referenced `ApiHeader`.
 * @see ApiHeader
 */
export type ApiHeaderComponent = Omit<ApiComponent<OpenApiHeader> | ApiComponent<OpenApiSchema>, '$ref'> & {
  /**
   * The referenced header, if the source object is a `$ref`.
   */
  $ref: ApiHeader | undefined;
};
/**
 * A response header. An OpenAPI 3.x header object is read as written. An OpenAPI 2.0 header is a schema-like object,
 * so it is treated as neither required nor deprecated, and its `schema` is the header object itself.
 * @see ApiResponse
 */
export type ApiHeader = ApiHeaderComponent & Omit<ApiParameter, 'target'>;

/**
 * The name of a JSON Schema type, such as `string` or `object`. The union includes `string`, so any other name is
 * accepted as well.
 */
export type ApiSchemaType = 'string' | 'number' | 'integer' | 'array' | 'boolean' | 'null' | 'object' | string;
/**
 * The shape of an `ApiSchema`, which selects the kind-specific fields in `ApiSchemaExtensions`. `multi-type` covers
 * type arrays with more than one non-null member, `combined` covers `allOf`/`anyOf` without properties, and `unknown`
 * covers schemas without a recognised type.
 * @see ApiSchemaExtensions
 */
export type ApiSchemaKind =
  | 'oneOf'
  | 'multi-type'
  | 'string'
  | 'number'
  | 'integer'
  | 'array'
  | 'boolean'
  | 'null'
  | 'object'
  | 'combined'
  | 'unknown';
/**
 * Whether a schema applies to requests, responses or both, derived from its `readOnly` and `writeOnly` flags. `all` is
 * used when neither flag is set, and `none` when both are set.
 */
export type ApiSchemaAccessibility = 'all' | 'readOnly' | 'writeOnly' | 'none';
/**
 * A named property of an object schema.
 * @see ApiSchemaExtensions
 */
export type ApiSchemaProperty = {
  /**
   * The property name, as the key in the `properties` keyword.
   */
  name: string;
  /**
   * The transformed schema of the property.
   */
  schema: ApiSchema;
};
/**
 * The `discriminator` of a schema, which names the property that selects a subtype and maps its values to schemas.
 * @see ApiSchemaBase
 */
export type ApiSchemaDiscriminator = {
  /**
   * The name of the discriminator property, from `discriminator.propertyName`.
   */
  propertyName: string;
  /**
   * The schemas that the discriminator values map to. It starts from the explicit `discriminator.mapping` and also
   * receives the named subtypes that inherit from this schema through `allOf`.
   */
  mapping: Record<string, ApiSchema>;
};
/**
 * The component fields of an `ApiSchema`, built from an OpenAPI schema object.
 * @see ApiSchema
 */
export type ApiSchemaComponent = ApiComponent<OpenApiSchema>;
/**
 * The fields that every `ApiSchema` has, whatever its kind. The fields that depend on the kind are in
 * `ApiSchemaExtensions`.
 * @see ApiSchema
 */
export type ApiSchemaBase = ApiSchemaComponent & {
  /**
   * The name of the schema: its `title` if set, otherwise a name derived from its place in the document. See
   * `isNameGenerated`.
   */
  name: string;
  /**
   * Whether `name` was synthesized from the location or the id of the schema, rather than taken from a `title` or from
   * a component or `definitions` key.
   */
  isNameGenerated: boolean;
  /**
   * The `description` of the schema, or `undefined`.
   */
  description: string | undefined;
  /**
   * Whether the schema is marked `deprecated`. Defaults to `false`.
   */
  deprecated: boolean;
  /**
   * Whether the schema applies to requests, responses or both, derived from `readOnly` and `writeOnly`.
   */
  accessibility: ApiSchemaAccessibility;
  /**
   * The allowed values from the `enum` keyword, as written, or `undefined`.
   */
  enum: unknown[] | undefined;
  /**
   * The fixed value from the `const` keyword, as written, or `undefined`.
   */
  const: unknown | undefined;
  /**
   * The `default` value as written, or `undefined`.
   */
  default: unknown | undefined;
  /**
   * The `example` value as written, or `undefined`. The plural `examples` keyword is not read.
   */
  example: unknown | undefined;
  /**
   * Whether `null` is an allowed value. This is set when the `type` keyword lists `null` (OpenAPI 3.1), when the
   * kind is `null`, or when the OpenAPI 3.0 `nullable` flag is `true`.
   */
  nullable: boolean;
  /**
   * The names of the properties that the `required` keyword lists. Empty if the keyword is absent.
   */
  required: Set<string>;
  /**
   * The `x-` extension fields of the schema, keyed without the `x-` prefix.
   */
  custom: Record<string, unknown>;
  /**
   * The transformed `not` schema, or `undefined`.
   */
  not: ApiSchema | undefined;
  /**
   * The discriminator of the schema, or `undefined` if it has none.
   */
  discriminator: ApiSchemaDiscriminator | undefined;
  /**
   * The base schemas that this schema extends, found through `allOf` or through a discriminator mapping. Each base
   * has a `discriminator`.
   */
  inheritedSchemas: (ApiSchema & { discriminator: NonNullable<ApiSchema['discriminator']> })[];
};
/**
 * A normalized schema: the base fields, plus the fields that belong to its kind. Every schema reached from the
 * documents becomes one `ApiSchema`.
 * @template T The kind of the schema. Defaults to every kind.
 * @see ApiSchemaExtensions
 */
export type ApiSchema<T extends ApiSchemaKind = ApiSchemaKind> = ApiSchemaBase & ApiSchemaExtensions<T>;
type AdditionalCombinedSchemaProperties = {
  /**
   * The transformed `allOf` schemas, or an empty array if the keyword is absent.
   */
  allOf: ApiSchema[];
  /**
   * The transformed `anyOf` schemas, or an empty array if the keyword is absent.
   */
  anyOf: ApiSchema[];
};
type AdditionalArraySchemaProperties = {
  /**
   * The schema of every element of the array, or `undefined` if the array does not constrain its elements to a
   * single schema. Note that an OpenAPI 3.1 tuple (`prefixItems`) has no single element schema: tuples are not
   * modelled, so `items` is `undefined` for them even though the OpenAPI schema has an `items` keyword.
   */
  items: ApiSchema | undefined;
  /**
   * The `minItems` bound, or `undefined` if the keyword is absent.
   */
  minItems: number | undefined;
  /**
   * The `maxItems` bound, or `undefined` if the keyword is absent.
   */
  maxItems: number | undefined;
};
type AdditionalObjectSchemaProperties = {
  /**
   * The properties of the object, keyed by property name. Empty if the schema declares none.
   */
  properties: Map<string, ApiSchemaProperty>;
  /**
   * The `additionalProperties` keyword: a boolean as written, the transformed schema, or `undefined` if absent.
   */
  additionalProperties: boolean | undefined | ApiSchema;
} & AdditionalCombinedSchemaProperties;
type AdditionalNumberSchemaProperties = {
  /**
   * The `minimum` bound, or `undefined` if the keyword is absent.
   */
  minimum: number | undefined;
  /**
   * The `maximum` bound, or `undefined` if the keyword is absent.
   */
  maximum: number | undefined;
};
type AdditionalStringSchemaProperties = {
  /**
   * The regular expression from the `pattern` keyword, or `undefined` if the keyword is absent.
   */
  pattern: string | undefined;
  /**
   * The `minLength` bound, or `undefined` if the keyword is absent.
   */
  minLength: number | undefined;
  /**
   * The `maxLength` bound, or `undefined` if the keyword is absent.
   */
  maxLength: number | undefined;
};
type AdditionalPrimitiveSchemaProperties = {
  /**
   * The `format` keyword, such as `date-time`, or `undefined` if the keyword is absent.
   */
  format: string | undefined;
};
/**
 * The fields that belong to a schema of kind `T`, selected by its `kind`. For `oneOf` the alternatives are listed in
 * `oneOf`, and for `multi-type` the member types are listed in `type`. The remaining fields hold the transformed values
 * of the keywords with the same names.
 * @template T The kind of the schema.
 * @see ApiSchemaKind
 */
export type ApiSchemaExtensions<T extends ApiSchemaKind> = T extends 'oneOf'
  ? { kind: 'oneOf'; oneOf: ApiSchema[] }
  : T extends 'multi-type'
    ? {
        kind: 'multi-type';
        type: ApiSchemaType[];
      } & AdditionalArraySchemaProperties &
        AdditionalObjectSchemaProperties &
        AdditionalNumberSchemaProperties &
        AdditionalStringSchemaProperties &
        AdditionalPrimitiveSchemaProperties
    : T extends 'string'
      ? { kind: 'string'; type: 'string' } & AdditionalStringSchemaProperties & AdditionalPrimitiveSchemaProperties
      : T extends 'boolean'
        ? { kind: 'boolean'; type: 'boolean' } & AdditionalPrimitiveSchemaProperties
        : T extends 'null'
          ? { kind: 'null'; type: 'null' }
          : T extends 'number' | 'integer'
            ? { kind: 'number' | 'integer'; type: T } & AdditionalNumberSchemaProperties &
                AdditionalPrimitiveSchemaProperties
            : T extends 'array'
              ? {
                  kind: 'array';
                  type: 'array';
                } & AdditionalArraySchemaProperties
              : T extends 'object'
                ? {
                    kind: 'object';
                    type: 'object';
                  } & AdditionalObjectSchemaProperties
                : T extends 'combined'
                  ? {
                      kind: 'combined';
                    } & AdditionalCombinedSchemaProperties
                  : { kind: 'unknown' };
/**
 * An `ApiSchema` narrowed to the kinds that can have `allOf` and `anyOf`: `combined`, `object` and `multi-type`.
 */
export type CombinedLikeApiSchema = ApiSchemaBase & {
  kind: 'combined' | 'object' | 'multi-type';
  type?: 'object' | string[];
} & AdditionalCombinedSchemaProperties;
/**
 * An `ApiSchema` narrowed to the numeric kinds: `number`, `integer` and `multi-type`, with their bounds and format.
 */
export type NumberLikeApiSchema = ApiSchemaBase & {
  kind: 'number' | 'integer' | 'multi-type';
  type: 'number' | 'integer' | string[];
} & AdditionalNumberSchemaProperties &
  AdditionalPrimitiveSchemaProperties;
/**
 * An `ApiSchema` narrowed to the array kinds: `array` and `multi-type`, with `items` and the item count bounds.
 */
export type ArrayLikeApiSchema = ApiSchemaBase & {
  kind: 'array' | 'multi-type';
  type: 'array' | string[];
} & AdditionalArraySchemaProperties;
/**
 * An `ApiSchema` narrowed to the object kinds: `object` and `multi-type`, with `properties` and `additionalProperties`.
 */
export type ObjectLikeApiSchema = ApiSchemaBase & {
  kind: 'object' | 'multi-type';
  type: 'object' | string[];
} & AdditionalObjectSchemaProperties;
/**
 * An `ApiSchema` narrowed to the string kinds: `string` and `multi-type`, with length bounds, `pattern` and `format`.
 */
export type StringLikeApiSchema = ApiSchemaBase & {
  kind: 'string' | 'multi-type';
  type: 'string' | string[];
} & AdditionalStringSchemaProperties &
  AdditionalPrimitiveSchemaProperties;
/**
 * An `ApiSchema` narrowed to the scalar kinds: `string`, `number`, `integer`, `boolean`, `null` and `multi-type`.
 */
export type PrimitiveLikeApiSchema = ApiSchemaBase & {
  kind: 'string' | 'number' | 'integer' | 'boolean' | 'null' | 'multi-type';
  type: 'string' | 'number' | 'integer' | 'boolean' | 'null' | string[];
} & AdditionalPrimitiveSchemaProperties;
