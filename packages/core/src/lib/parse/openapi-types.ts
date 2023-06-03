export type OpenApiReference = {
  /**
   * Allows for an external definition of this object.
   */
  $ref: string;
};
export type OpenApiObject<TMarker extends string> = Record<`x-${string}`, unknown> &
  Partial<OpenApiReference> & {
    __marker?: TMarker;
  };

export type OpenApiDocument = OpenApiObject<'document'> & {
  /**
   * The OpenAPI (v3.x) version.
   */
  openapi?: string;
  /**
   * Provides metadata about the API. The metadata MAY be used by tooling as required.
   */
  info?: OpenApiInfo;
  /**
   * An array of Server Objects, which provide connectivity information to a target server. If the servers property is not provided, or is an empty array, the default value would be a Server Object with a url value of /.
   */
  servers?: OpenApiServer[];
  /**
   * The available paths and operations for the API.
   */
  paths?: Record<string, OpenApiPathItem>;
  /**
   * The available webhooks for the API.
   */
  webhooks?: Record<string, OpenApiPathItem>;
  /**
   * An element to hold various schemas for the specification.
   */
  components?: OpenApiComponents;
  /**
   * A declaration of which security mechanisms can be used across the API.
   */
  security?: Record<string, string[]>[];
  /**
   * A list of tags used by the specification with additional metadata. The order of the tags can be used to reflect on their order by the parsing tools.
   */
  tags?: OpenApiTag[];
  /**
   * Additional external documentation.
   */
  externalDocs?: OpenApiExternalDocumentation;
  /**
   * The JSON Schema version used for schemas.
   */
  jsonSchemaDialect?: string;

  /**
   * The OpenAPI (v2.x) version.
   */
  swagger?: string;
  /**
   * (OpenAPI v2) The common base URL path for all API endpoints.
   */
  basePath?: string;
  /**
   * (OpenAPI v2) A list of MIME types the API can consume.
   */
  consumes?: string[];
  /**
   * (OpenAPI v2) A list of MIME types the API can produce.
   */
  produces?: string[];
  /**
   * (OpenAPI v2) An object that defines reusable definitions for data models.
   */
  definitions?: Record<string, OpenApiSchema>;
  /**
   * (OpenAPI v2) The host (name or IP) serving the API.
   */
  host?: string;
  /**
   * (OpenAPI v2) A list of parameters that can be used across all operations.
   */
  parameters?: Record<string, OpenApiParameter>;
  /**
   * (OpenAPI v2) A list of responses that can be used across all operations.
   */
  responses?: Record<string, OpenApiResponse>;
  /**
   * (OpenAPI v2) A list of transfer protocols the API supports.
   */
  schemes?: string[];
  /**
   * (OpenAPI v2) A list of security definitions that can be used across all operations.
   */
  securityDefinitions?: Record<string, OpenApiSecurityScheme>;
};

export type OpenApiInfo = OpenApiObject<'info'> & {
  /**
   * The title of the API.
   */
  title?: string;
  /**
   * The version of the API.
   */
  version?: string;
  /**
   * A short description of the API.
   */
  summary?: string;
  /**
   * A longer description of the API. Should be different from the summary. CommonMark is allowed.
   */
  description?: string;
  /**
   * A URL to the Terms of Service for the API. MUST be in the format of a URL.
   */
  termsOfService?: string;
  /**
   * The contact information for the exposed API.
   */
  contact?: OpenApiContact;
  /**
   * The license information for the exposed API.
   */
  license?: OpenApiLicense;
};
export type OpenApiContact = OpenApiObject<'contact'> & {
  /**
   * The identifying name of the contact person/organization.
   */
  name?: string;
  /**
   * The URL pointing to the contact information. MUST be in the format of a URL.
   */
  url?: string;
  /**
   * The email address of the contact person/organization. MUST be in the format of an email address.
   */
  email?: string;
};
export type OpenApiLicense = OpenApiObject<'license'> & {
  /**
   * The license name used for the API.
   */
  name?: string;
  /**
   * A URL to the license used for the API. MUST be in the format of a URL.
   */
  url?: string;
  /**
   * The license identifier used for the API.
   */
  identifier?: string;
};

export type OpenApiServer = OpenApiObject<'server'> & {
  /**
   * A URL to the target host. This URL supports Server Variables and MAY be relative, to indicate that the host location is relative to the location where the OpenAPI document is being served. Variable substitutions will be made when a variable is named in {brackets}.
   */
  url?: string;
  /**
   * An optional string describing the host designated by the URL. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * A map between a variable name and its value. The value is used for substitution in the server's URL template.
   */
  variables?: Record<string, OpenApiServerVariable>;
};
export type OpenApiServerVariable = OpenApiObject<'server-variable'> & {
  /**
   * An enumeration of string values to be used if the substitution options are from a limited set.
   */
  enum?: string[];
  /**
   * The default value to use for substitution, which SHALL be sent if an alternate value is _not_ supplied. Note this behavior is different than the Schema Object's treatment of default values, because in those cases parameter values are optional. If the enum is defined, the value SHOULD exist in the enum's values.
   */
  default?: string;
  /**
   * An optional description for the server variable. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
};

export type OpenApiParameterBase<TMarker extends string> = OpenApiObject<'param-base'> & {
  /**
   * A brief description of the parameter. This could contain examples of use. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * Determines whether this parameter is mandatory. If the parameter location is "path", this property is REQUIRED and its value MUST be true. Otherwise, the property MAY be included and its default value is false.
   */
  required?: boolean;
  /**
   * Specifies that a parameter is deprecated and SHOULD be transitioned out of usage. Default value is false.
   */
  deprecated?: boolean;
  /**
   * Sets the ability to pass empty-valued parameters. This is valid only for query parameters and allows sending a parameter with an empty value. Default value is false. If style is used, and if behavior is n/a (cannot be serialized), the value of allowEmptyValue SHALL be ignored. Use of this property is NOT RECOMMENDED, as it is likely to be removed in a later revision.
   */
  allowEmptyValue?: boolean;
  /**
   * Describes how the parameter value will be serialized depending on the type of the parameter value. Default values (based on value of in): for query - form; for path - simple; for header - simple; for cookie - form.
   */
  style?: string;
  /**
   * When this is true, parameter values of type array or object generate separate parameters for each value of the array or key-value pair of the map. For other types of parameters this property has no effect. When style is form, the default value is true. For all other styles, the default value is false.
   */
  explode?: boolean;
  /**
   * Determines whether the parameter value SHOULD allow reserved characters, as defined by RFC3986 :/?#[]@!$&'()*+,;= to be included without percent-encoding. The default value is false.
   */
  allowReserved?: boolean;
  /**
   * The schema defining the type used for the parameter.
   */
  schema?: OpenApiSchema;
  /**
   * Example of the media type. The example SHOULD match the specified schema and encoding properties if present. The example object is mutually exclusive of the examples object. Furthermore, if referencing a schema which contains an example, the example value SHALL override the example provided by the schema.
   */
  example?: unknown;
  /**
   * Examples of the media type. Each example object SHOULD match the media type and specified schema if present. The examples object is mutually exclusive of the example object. Furthermore, if referencing a schema which contains an example, the examples value SHALL override the example provided by the schema.
   */
  examples?: Record<string, OpenApiExample>;
  /**
   * A map containing the representations for the parameter. The key is the media type and the value describes it. The map MUST only contain one entry.
   */
  content?: Record<string, OpenApiMediaType>;
} & { __pbMarker: TMarker };
export type OpenApiHeader = OpenApiParameterBase<'header'>;
export type OpenApiExample = OpenApiObject<'example'> & {
  /**
   * Short description for the example.
   */
  summary?: string;
  /**
   * Long description for the example. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * Embedded literal example. The value field and externalValue field are mutually exclusive. To represent examples of media types that cannot naturally represented in JSON or YAML, use a string value to contain the example, escaping where necessary.
   */
  value?: unknown;
  /**
   * A URL that points to the literal example. This provides the capability to reference examples that cannot easily be included in JSON or YAML documents. The value field and externalValue field are mutually exclusive.
   */
  externalValue?: string;
};
export type OpenApiMediaType = OpenApiObject<'media-type'> & {
  /**
   * The schema defining the type used for the component.
   */
  schema?: OpenApiSchema;
  /**
   * Example of the media type. The example object SHOULD be in the correct format as specified by the media type. The example object is mutually exclusive of the examples object. Furthermore, if referencing a schema which contains an example, the example value SHALL override the example provided by the schema.
   */
  example?: unknown;
  /**
   * Examples of the media type. Each example object SHOULD match the media type and specified schema if present. The examples object is mutually exclusive of the example object. Furthermore, if referencing a schema which contains an example, the examples value SHALL override the example provided by the schema.
   */
  examples?: Record<string, OpenApiExample>;
  /**
   * A map between a property name and its encoding information. The key, being the property name, MUST exist in the schema as a property. The encoding object SHALL only apply to requestBody objects when the media type is multipart or application/x-www-form-urlencoded.
   */
  encoding?: Record<string, OpenApiEncoding>;
};
export type OpenApiEncoding = OpenApiObject<'encoding'> & {
  /**
   * The Content-Type for encoding a specific property. Default value depends on the property type: for string with format being binary – application/octet-stream; for other primitive types – text/plain; for object - application/json; for array – the default is defined based on the inner type. The value can be a specific media type (e.g. application/json), a wildcard media type (e.g. image/*), or a comma-separated list of the two types.
   */
  contentType?: string;
  /**
   * A map allowing additional information to be provided as headers, for example Content-Disposition. Content-Type is described separately and SHALL be ignored in this section. This property SHALL be ignored if the request body media type is not a multipart.
   */
  headers?: Record<string, OpenApiHeader>;
  /**
   * Describes how a specific property value will be serialized depending on its type. See Parameter Object for details on the style property. The behavior follows the same values as query parameters, including default values. This property SHALL be ignored if the request body media type is not application/x-www-form-urlencoded.
   */
  style?: string;
  /**
   * When this is true, property values of type array or object generate separate parameters for each value of the array, or key-value-pair of the map. For other types of properties this property has no effect. When style is form, the default value is true. For all other styles, the default value is false. This property SHALL be ignored if the request body media type is not application/x-www-form-urlencoded.
   */
  explode?: boolean;
  /**
   * Determines whether the parameter value SHOULD allow reserved characters, as defined by RFC3986 :/?#[]@!$&'()*+,;= to be included without percent-encoding. The default value is false. This property SHALL be ignored if the request body media type is not application/x-www-form-urlencoded.
   */
  allowReserved?: boolean;
};

export type OpenApiHttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';
export type OpenApiPathItem = OpenApiObject<'path-item'> & {
  /**
   * An optional, string summary, intended to apply to all operations in this path.
   */
  summary?: string;
  /**
   * An optional, string description, intended to apply to all operations in this path. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * Servers MAY be referenced here to override the servers defined at the OpenAPI Object's root level.
   */
  servers?: OpenApiServer[];
  /**
   * A list of parameters that are applicable for all the operations described under this path. These parameters can be overridden at the operation level, but cannot be removed there. The list MUST NOT include duplicated parameters. A unique parameter is defined by a combination of a name and location. The list can use the Reference Object to link to parameters that are defined at the OpenAPI Object's components/parameters.
   */
  parameters?: OpenApiParameter[];
} & {
  /**
   * The list of operations available on the path.
   */
  [method in OpenApiHttpMethod]?: OpenApiOperation;
};
export type KnownOpenApiParameterTarget = 'path' | 'query' | 'header' | 'cookie' | 'body' | 'form';
export type OpenApiParameterTarget = KnownOpenApiParameterTarget | string;
export type OpenApiParameter = OpenApiParameterBase<'parameter'> & {
  /**
   * The name of the parameter. Parameter names are case sensitive.
   */
  name?: string;
  /**
   * The location of the parameter. Possible values are "query", "header", "path" or "cookie".
   */
  in?: OpenApiParameterTarget;
};
export type OpenApiOperation = OpenApiObject<'operation'> & {
  /**
   * A list of tags for API documentation control. Tags can be used for logical grouping of operations by resources or any other qualifier.
   */
  tags?: string[];
  /**
   * A short summary of what the operation does.
   */
  summary?: string;
  /**
   * A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * Additional external documentation for this operation.
   */
  externalDocs?: OpenApiExternalDocumentation;
  /**
   * Unique string used to identify the operation. The id MUST be unique among all operations described in the API. The operationId value is case-sensitive. Tools and libraries MAY use the operationId to uniquely identify an operation, therefore, it is RECOMMENDED to follow common programming naming conventions.
   */
  operationId?: string;
  /**
   * A list of parameters that are applicable for this operation. If a parameter is already defined at the Path Item, the new definition will override it, but can never remove it. The list MUST NOT include duplicated parameters. A unique parameter is defined by a combination of a name and location. The list can use the Reference Object to link to parameters that are defined at the OpenAPI Object's components/parameters.
   */
  parameters?: OpenApiParameter[];
  /**
   * The request body applicable for this operation. The requestBody is only supported in HTTP methods where the HTTP 1.1 specification RFC7231 has explicitly defined semantics for request bodies. In other cases where the HTTP spec is vague, requestBody SHALL be ignored by consumers.
   */
  requestBody?: OpenApiRequestBody;
  /**
   * The list of possible responses as they are returned from executing this operation.
   */
  responses: Record<string, OpenApiResponse> & {
    /**
     * The default response object for all HTTP codes that are not covered individually by the specification. The default MAY be used as a default response object for all HTTP codes that are not covered individually by the specification. The Responses Object MUST contain at least one response code, and it SHOULD be the response for a successful operation call.
     */
    default?: OpenApiResponse;
  };
  /**
   * A map of possible out-of band callbacks related to the parent operation. The key is a unique identifier for the Callback Object. Each value in the map is a Callback Object that describes a request that may be initiated by the API provider and the expected responses. The key value used to identify the callback object is an expression, evaluated at runtime, that identifies a URL to use for the callback operation.
   */
  callbacks?: Record<string, OpenApiReference | Record<string, OpenApiPathItem>>;
  /**
   * Declares this operation to be deprecated. Consumers SHOULD refrain from usage of the declared operation. Default value is false.
   */
  deprecated?: boolean;
  /**
   * A declaration of which security mechanisms can be used for this operation. The list of values includes alternative security requirement objects that can be used. Only one of the security requirement objects need to be satisfied to authorize a request. This definition overrides any declared top-level security. To remove a top-level security declaration, an empty array can be used.
   */
  security?: Record<string, string[]>[];
  /**
   * An alternative server array to service this operation. If an alternative server object is specified at the Path Item Object or Root level, it will be overridden by this value.
   */
  servers?: OpenApiServer[];

  /**
   * (OpenAPI v2) The MIME types the operation can consume. This overrides the consumes definition at the OpenAPI Object. An empty value MAY be used to clear the global definition. Value MUST be as described under Mime Types.
   */
  consumes?: Record<string, string[]>;
  /**
   * (OpenAPI v2) The MIME types the operation can produce. This overrides the produces definition at the OpenAPI Object. An empty value MAY be used to clear the global definition. Value MUST be as described under Mime Types.
   */
  produces?: Record<string, string[]>;
  schemes?: string[];
};
export type OpenApiExternalDocumentation = OpenApiObject<'external-doc'> & {
  /**
   * A short description of the target documentation. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * The URL for the target documentation. Value MUST be in the format of a URL.
   */
  url: string;
};
export type OpenApiRequestBody = OpenApiObject<'request-body'> & {
  /**
   * A brief description of the request body. This could contain examples of use. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * The content of the request body. The key is a media type or media type range and the value describes it. For requests that match multiple keys, only the most specific key is applicable. e.g. text/plain overrides text/*
   */
  content: Record<string, OpenApiMediaType>;
  /**
   * Determines if the request body is required in the request. Defaults to false.
   */
  required?: boolean;
};
export type OpenApiResponse = OpenApiObject<'response'> & {
  /**
   * A short description of the response. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * Maps a header name to its definition. RFC7230 states header names are case insensitive. If a response header is defined with the name "Content-Type", it SHALL be ignored.
   */
  headers?: Record<string, OpenApiHeader | OpenApiSchema>;
  /**
   * A map containing descriptions of potential response payloads. The key is a media type or media type range and the value describes it. For responses that match multiple keys, only the most specific key is applicable. e.g. text/plain overrides text/*
   */
  content?: Record<string, OpenApiMediaType>;
  /**
   * A map of operations links that can be followed from the response. The key of the map is a short name for the link, following the naming constraints of the names for Component Objects.
   */
  links?: Record<string, OpenApiLink>;

  /**
   * (OpenAPI v2) A schema defining the type used for the response body.
   */
  schema?: OpenApiSchema;
  /**
   * (OpenAPI v2) Examples of the response message.
   */
  examples?: Record<string, unknown>;
};
export type OpenApiLink = OpenApiObject<'link'> & {
  /**
   * A relative or absolute reference to an OAS operation. This field is mutually exclusive of the operationId field, and MUST point to an Operation Object. Relative operationRef values MAY be used to locate an existing Operation Object in the OpenAPI definition.
   */
  operationRef?: string;
  /**
   * The name of an existing, resolvable OAS operation, as defined with a unique operationId. This field is mutually exclusive of the operationRef field.
   */
  operationId?: string;
  /**
   * A map representing parameters to pass to an operation as specified with operationId or identified via operationRef. The key is the parameter name to be used, whereas the value can be a constant or an expression to be evaluated and passed to the linked operation. The parameter name can be qualified using the parameter location [{in}.]{name} for operations that use the same parameter name in different locations (e.g. path.id).
   */
  parameters?: Record<string, unknown>;
  /**
   * A literal value or {expression} to use as a request body when calling the target operation.
   */
  requestBody?: unknown;
  /**
   * A description of the link. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * A server object to be used by the target operation.
   */
  server?: OpenApiServer;
};

export type OpenApiComponents = OpenApiObject<'components'> & {
  /**
   * An object to hold reusable OpenAPI objects.
   */
  schemas?: Record<string, OpenApiSchema>;
  /**
   * An object to hold reusable Security Scheme Objects.
   */
  responses?: Record<string, OpenApiResponse>;
  /**
   * An object to hold reusable Parameter Objects.
   */
  parameters?: Record<string, OpenApiParameter>;
  /**
   * An object to hold reusable Example Objects.
   */
  examples?: Record<string, OpenApiExample>;
  /**
   * An object to hold reusable Request Body Objects.
   */
  requestBodies?: Record<string, OpenApiRequestBody>;
  /**
   * An object to hold reusable Header Objects.
   */
  headers?: Record<string, OpenApiHeader>;
  /**
   * An object to hold reusable Security Scheme Objects.
   */
  securitySchemes?: Record<string, OpenApiSecurityScheme>;
  /**
   * An object to hold reusable Link Objects.
   */
  links?: Record<string, OpenApiLink>;
  /**
   * An object to hold reusable Callback Objects.
   */
  callbacks?: Record<string, OpenApiReference | Record<string, OpenApiPathItem>>;
  /**
   * An object to hold reusable Path Item Objects.
   */
  pathItems?: Record<string, OpenApiPathItem>;
};

export type OpenApiSecurityScheme =
  | OpenApiHttpSecurityScheme
  | OpenApiApiKeySecurityScheme
  | OpenApiOAuth2SecurityScheme
  | OpenApiOpenIdSecurityScheme
  | OpenApiObject<'security-scheme'>;
export type OpenApiBasicSecurityScheme = OpenApiObject<'security-scheme'> & {
  /**
   * The type of the security scheme.
   */
  type: 'basic';
  /**
   * A short description for security scheme. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
};
export type OpenApiHttpSecurityScheme = OpenApiObject<'security-scheme'> & {
  /**
   * The type of the security scheme.
   */
  type: 'http';
  /**
   * A short description for security scheme. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * The name of the HTTP Authorization scheme to be used in the Authorization header as defined in RFC7235.
   */
  scheme?: string;
  /**
   * A hint to the client to identify how the bearer token is formatted. Bearer tokens are usually generated by an authorization server, so this information is primarily for documentation purposes.
   */
  bearerFormat?: string;
};
export type KnownOpenApiApiKeySource = 'query' | 'header' | 'cookie';
export type OpenApiApiKeySource = KnownOpenApiApiKeySource | string;
export type OpenApiApiKeySecurityScheme = OpenApiObject<'security-scheme'> & {
  /**
   * The type of the security scheme.
   */
  type: 'apiKey';
  /**
   * A short description for security scheme. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * The name of the header, query or cookie parameter to be used.
   */
  name?: string;
  /**
   * The location of the API key. Valid values are "query", "header" or "cookie".
   */
  in?: OpenApiApiKeySource;
};
export type KnownOpenApiOAuth2SecurityFlow = 'implicit' | 'password' | 'application' | 'accessCode';
export type OpenApiOAuth2SecurityFlow = KnownOpenApiOAuth2SecurityFlow | string;
export type OpenApiOAuth2SecurityScheme = OpenApiObject<'security-scheme'> & {
  /**
   * The type of the security scheme.
   */
  type: 'oauth2';
  /**
   * A short description for security scheme. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * An object containing configuration information for the flow types supported.
   */
  flows?: {
    /**
     * Configuration for the OAuth Implicit flow
     */
    implicit?: {
      /**
       * The authorization URL to be used for this flow. This MUST be in the form of a URL.
       */
      authorizationUrl?: string;
      /**
       * The URL to be used for obtaining refresh tokens. This MUST be in the form of a URL.
       */
      refreshUrl?: string;
      /**
       * The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it.
       */
      scopes?: Record<string, string>;
    };
    /**
     * Configuration for the OAuth Resource Owner Password flow
     */
    password?: {
      /**
       * The token URL to be used for this flow. This MUST be in the form of a URL.
       */
      tokenUrl?: string;
      /**
       * The URL to be used for obtaining refresh tokens. This MUST be in the form of a URL.
       */
      refreshUrl?: string;
      /**
       * The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it.
       */
      scopes?: Record<string, string>;
    };
    /**
     * Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0.
     */
    clientCredentials?: {
      /**
       * The token URL to be used for this flow. This MUST be in the form of a URL.
       */
      tokenUrl?: string;
      /**
       * The URL to be used for obtaining refresh tokens. This MUST be in the form of a URL.
       */
      refreshUrl?: string;
      /**
       * The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it.
       */
      scopes?: Record<string, string>;
    };
    /**
     * Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0.
     */
    authorizationCode?: {
      /**
       * The authorization URL to be used for this flow. This MUST be in the form of a URL.
       */
      authorizationUrl?: string;
      /**
       * The token URL to be used for this flow. This MUST be in the form of a URL.
       */
      tokenUrl?: string;
      /**
       * The URL to be used for obtaining refresh tokens. This MUST be in the form of a URL.
       */
      refreshUrl?: string;
      /**
       * The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it.
       */
      scopes?: Record<string, string>;
    };
  };
  /**
   * (OpenAPI v2) The flow used by the OAuth2 security scheme. Valid values are "implicit", "password", "application" or "accessCode".
   */
  flow?: OpenApiOAuth2SecurityFlow;
  /**
   * (OpenAPI v2) The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it.
   */
  scopes?: Record<string, string>;
  /**
   * (OpenAPI v2: implicit, accessCode) The authorization URL to be used for this flow. This MUST be in the form of a URL.
   */
  authorizationUrl?: string;
  /**
   * (OpenAPI v2: accessCode, password, application) The token URL to be used for this flow. This MUST be in the form of a URL.
   */
  tokenUrl?: string;
};
export type OpenApiOpenIdSecurityScheme = OpenApiObject<'security-scheme'> & {
  /**
   * The type of the security scheme.
   */
  type: 'openIdConnect';
  /**
   * A short description for security scheme. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * OpenId Connect URL to discover OAuth2 configuration values. This MUST be in the form of a URL.
   */
  openIdConnectUrl: string;
};

export type OpenApiTag = OpenApiObject<'tag'> & {
  /**
   * The name of the tag.
   */
  name?: string;
  /**
   * A short description for the tag. CommonMark syntax MAY be used for rich text representation.
   */
  description?: string;
  /**
   * Additional external documentation for this tag.
   */
  externalDocs?: OpenApiExternalDocumentation;
};

export type KnownOpenApiSchemaType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'integer' | 'null';
export type OpenApiSchemaType = KnownOpenApiSchemaType | string;

export type KnownOpenApiSchemaFormat =
  | 'int32'
  | 'int64'
  | 'float'
  | 'double'
  | 'byte'
  | 'binary'
  | 'date'
  | 'date-time'
  | 'time'
  | 'duration'
  | 'email'
  | 'idn-email'
  | 'hostname'
  | 'idn-hostname'
  | 'ipv4'
  | 'ipv6'
  | 'uri'
  | 'uri-reference'
  | 'iri'
  | 'iri-reference'
  | 'uri-template'
  | 'json-pointer'
  | 'relative-json-pointer'
  | 'regex'
  | 'password';
export type OpenApiSchemaFormat = KnownOpenApiSchemaFormat | string;

export type OpenApiSchema = OpenApiObject<'schema'> & {
  /**
   * Type of the schema (e.g., object, array, string, number, boolean, integer).
   */
  type?: OpenApiSchemaType | OpenApiSchemaType[];
  /**
   * Properties of the schema (for object type).
   */
  properties?: Record<string, OpenApiSchema>;
  /**
   * Schema for array items (for array type).
   */
  items?: OpenApiSchema;
  /**
   * Required properties for an object schema.
   */
  required?: string[];
  /**
   * Possible values for the schema.
   */
  enum?: unknown[];
  /**
   * Format of the schema value.
   */
  format?: OpenApiSchemaFormat;
  /**
   * Additional properties allowed for an object schema.
   */
  additionalProperties?: OpenApiSchema | boolean;
  /**
   * List of schemas that can match (logical OR).
   */
  anyOf?: OpenApiSchema[];
  /**
   * List of mutually exclusive schemas (logical XOR).
   */
  oneOf?: OpenApiSchema[];
  /**
   * List of schemas that must all match (logical AND).
   */
  allOf?: OpenApiSchema[];
  /**
   * Schema that must not match (logical NOT).
   */
  not?: OpenApiSchema;
  /**
   * Minimum length for a string schema.
   */
  minLength?: number;
  /**
   * Maximum length for a string schema.
   */
  maxLength?: number;
  /**
   * Minimum value for a number schema.
   */
  minimum?: number;
  /**
   * Maximum value for a number schema.
   */
  maximum?: number;
  /**
   * Whether the minimum value is exclusive or the exclusive minimum.
   */
  exclusiveMinimum?: boolean | number;
  /**
   * Whether the maximum value is exclusive or the exclusive maximum.
   */
  exclusiveMaximum?: boolean | number;
  /**
   * Regular expression pattern for a string schema.
   */
  pattern?: string;
  /**
   * Default value for the schema.
   */
  default?: unknown;
  /**
   * Title of the schema.
   */
  title?: string;
  /**
   * Description of the schema.
   */
  description?: string;
  /**
   * Number that the value must be a multiple of.
   */
  multipleOf?: number;
  /**
   * Additional items allowed for an array schema.
   */
  additionalItems?: OpenApiSchema | boolean;
  /**
   * Maximum number of items for an array schema.
   */
  maxItems?: number;
  /**
   * Minimum number of items for an array schema.
   */
  minItems?: number;
  /**
   * Whether the items in an array must be unique.
   */
  uniqueItems?: boolean;
  /**
   * Maximum number of properties for an object schema.
   */
  maxProperties?: number;
  /**
   * Minimum number of properties for an object schema.
   */
  minProperties?: number;
  /**
   * JSON schemas for definitions.
   */
  definitions?: Record<string, OpenApiSchema>;
  /**
   * JSON schemas for properties that match a pattern.
   */
  patternProperties?: Record<string, OpenApiSchema>;
  /**
   * Dependencies between properties.
   */
  dependencies?: Record<string, OpenApiSchema>;
  /**
   * Whether the schema is nullable. (Only used in OpenAPI v3; same as type: [type, 'null'])
   */
  nullable?: boolean;
  /**
   * Defines the property used for discriminating between different polymorphic schemas.
   * This property is specific to OpenAPI v3 and is used for object schemas that involve polymorphism and inheritance.
   */
  discriminator?: OpenApiDiscriminator | string;
  /**
   * Whether the schema is read-only. (Only used in OpenAPI v3.x)
   */
  readOnly?: boolean;
  /**
   * Whether the schema is write-only. (Only used in OpenAPI v3.x)
   */
  writeOnly?: boolean;
  /**
   * Additional external documentation for this schema.
   */
  externalDocs?: OpenApiExternalDocumentation;
  /**
   * Example value for the schema.
   */
  example?: unknown;
  /**
   * Examples for the schema.
   */
  examples?: unknown[];
  /**
   * XML metadata for the schema.
   */
  xml?: OpenApiXml;
  /**
   * The content media type for the schema.
   */
  contentMediaType?: string;
  /**
   * A constant value for the schema.
   */
  const?: unknown;
  /**
   * Whether the schema is deprecated.
   */
  deprecated?: boolean;
};

export type OpenApiDiscriminator = OpenApiObject<'discriminator'> & {
  /**
   * The name of the property in the payload that will hold the discriminator value.
   */
  propertyName: string;
  /**
   * An object to hold mappings between payload values and schema names or references.
   */
  mapping?: {
    /**
     * The discriminator value to match.
     */
    [key: string]: string;
  };
};
export type OpenApiXml = OpenApiObject<'xml'> & {
  /**
   * Replaces the name of the element/attribute used for the described schema property.
   */
  name?: string;
  /**
   * The URI of the namespace definition. Value MUST be in the form of an absolute URI.
   */
  namespace?: string;
  /**
   * The prefix to be used for the name.
   */
  prefix?: string;
  /**
   * Declares whether the property definition translates to an attribute instead of an element.
   */
  attribute?: boolean;
  /**
   * Specifies whether to wrap the schema object within an additional XML element. Useful when a schema object needs to be contained within another XML element.
   */
  wrapped?: boolean;
  /**
   * Specifies the XML element name to be used when `wrapped` is set to `true`.
   */
  wrappedName?: string;
};
