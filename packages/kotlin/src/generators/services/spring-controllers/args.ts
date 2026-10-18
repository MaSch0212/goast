import type { ApiEndpoint, ApiResponse, ApiSchema, SourceBuilder } from '@goast/core';

import type { kt } from '../../../ast/index.ts';
import type { ApiParameterWithMultipartInfo } from '../../../types.ts';

// #region API Response Entities
/**
 * Arguments for writing a file that holds response entity classes. The default generator does not use it, because it
 * nests the response entity classes in the API interface.
 */
export type GenerateApiResponseEntitiesFile = {
  /**
   * The directory the file is written to, such as `{outputDir}/com/openapi/generated/api` with the default settings.
   */
  dirPath: string;
  /**
   * The package the file is declared in, with `packageSuffix` already applied.
   */
  packageName: string;
};

/**
 * Arguments for building the content of a response entities file. The default generator does not use it. The
 * `packageName` is the package declared at the top of the file, with `packageSuffix` already applied.
 */
export type GetApiResponseEntitiesFileContent = { packageName: string };

/**
 * Arguments for building the response entity classes of a file. It takes no properties, and the default generator
 * does not call it.
 */
export type GetApiResponseEntities = object;
// #endregion

// #region API Interface
/**
 * Arguments for writing the API interface file of a service.
 */
export type GenerateApiInterfaceFile = {
  /**
   * The directory the interface file is written to, such as `{outputDir}/com/openapi/generated/api`.
   */
  dirPath: string;
  /**
   * The package the interface is declared in, with `packageSuffix` already applied.
   */
  packageName: string;
};

/**
 * Arguments for building the content of the API interface file. Its `interfaceName` is the name of the interface
 * declared in the file.
 */
export type GetApiInterfaceFileContent = { interfaceName: string };

/**
 * Arguments for building the API interface declaration, including its functions and path constants. Its
 * `interfaceName` is the name of the interface, already converted with `typeNameCasing`.
 */
export type GetApiInterface = { interfaceName: string };

/**
 * Arguments for building the interface function of one endpoint. Its `endpoint` is the endpoint whose parameters and
 * responses determine the signature.
 */
export type GetApiInterfaceEndpointMethod = { endpoint: ApiEndpoint };

/**
 * Arguments for building the `{Endpoint}_ResponseEntity` class of one endpoint, which is nested in the API interface.
 * Its `endpoint` is the endpoint whose response status codes add static factory functions.
 */
export type GetApiResponseEntityClass = { endpoint: ApiEndpoint };
// #endregion

// #region API Controller
/**
 * Arguments for writing the controller file of a service.
 */
export type GenerateApiControllerFile = {
  /**
   * The directory the controller file is written to, derived from its package below `outputDir`.
   */
  dirPath: string;
  /**
   * The package the controller class is declared in, with `packageSuffix` already applied.
   */
  packageName: string;
};

/**
 * Arguments for building the content of the controller file. Its `controllerName` is the name of the controller class
 * declared in the file.
 */
export type GetApiControllerFileContent = { controllerName: string };

/**
 * Arguments for building the controller class, which implements the API interface and forwards to the delegate.
 * Its `controllerName` is the name of the class, already converted with `typeNameCasing`.
 */
export type GetApiController = { controllerName: string };
// #endregion

// #region API Delegate Interface
/**
 * Arguments for writing the delegate interface file of a service.
 */
export type GenerateApiDelegateInterfaceFile = {
  /**
   * The directory the delegate file is written to. It is the same directory as the API interface file.
   */
  dirPath: string;
  /**
   * The package the delegate interface is declared in, with `packageSuffix` already applied.
   */
  packageName: string;
};

/**
 * Arguments for building the content of the delegate interface file. Its `delegateInterfaceName` is the name of the
 * delegate interface declared in the file.
 */
export type GetApiDelegateInterfaceFileContent = { delegateInterfaceName: string };

/**
 * Arguments for building the delegate interface declaration, which has one function per endpoint. Its
 * `delegateInterfaceName` is the name of the interface, already converted with `typeNameCasing`.
 */
export type GetApiDelegateInterface = { delegateInterfaceName: string };

/**
 * Arguments for building the delegate function of one endpoint. Its return type follows the endpoint's
 * `strict-response` setting and `strictResponseEntities`. Its `endpoint` is the endpoint whose responses determine the
 * default return type.
 */
export type GetApiDelegateInterfaceEndpointMethod = { endpoint: ApiEndpoint };
// #endregion

/**
 * Arguments for resolving the Kotlin type of a parameter.
 */
export type GetParameterType = {
  /**
   * The endpoint the parameter belongs to. The default implementation does not read it.
   */
  endpoint: ApiEndpoint;
  /**
   * The parameter whose type is resolved. Multipart file parts resolve to `FilePart`, and body parameters are
   * adjusted by `arrayType`.
   */
  parameter: ApiParameterWithMultipartInfo;
  /**
   * A reference that replaces the type derived from the parameter schema, such as `String` for an enum parameter.
   */
  type?: kt.Reference<SourceBuilder>;
};

/**
 * Arguments for resolving the body type of a response, which becomes the type argument of `ResponseEntity`. Its
 * `endpoint` is the endpoint whose responses are inspected when `response` is not given. Its `response` is the single
 * response whose body type is resolved. When omitted, the body types of all responses are combined, and differing body
 * types resolve to `Any`.
 */
export type GetResponseType = { endpoint: ApiEndpoint; response?: ApiResponse };

/**
 * Arguments for resolving the type of a schema in a usage position, such as a parameter or a response body.
 * @template TBuilder The type of the source builder the resolved type is written to.
 */
export type GetTypeUsage<TBuilder extends SourceBuilder> = {
  /**
   * The schema the type is derived from. When it is `undefined`, the fallback type is used.
   */
  schema: ApiSchema | undefined;
  /**
   * Overrides the nullability of the resolved type. When omitted, the nullability of the derived type is kept.
   */
  nullable?: boolean;
  /**
   * The type used when no type can be derived from the schema. Defaults to `Any`, nullable when `nullable` is set.
   */
  fallback?: kt.Type<TBuilder>;
  /**
   * A reference that replaces the type derived from the schema.
   */
  type?: kt.Reference<TBuilder>;
};

/**
 * Arguments for building the KDoc text of an endpoint function. Its `endpoint` is the endpoint whose description is
 * used, with its source location appended when `includeSourceInDocs` is set.
 */
export type GetEndpointDocDescription = { endpoint: ApiEndpoint };

/**
 * Arguments for looking up the type that the models generator assigned to a schema. Its `schema` is looked up in the
 * `kotlin.models` output by `id`, and `undefined` yields `undefined`.
 */
export type GetSchemaType = { schema: ApiSchema | undefined };

/**
 * Arguments for building the `@RequestMapping` value of the API interface or the controller. Its `prefix` is the
 * property prefix of the base path placeholder, such as `openapi.pet` in `propertyNameCasing`. The API interface passes
 * `api`, and the default is `openapi.<service>`.
 */
export type GetControllerRequestMapping = { prefix?: string };

/**
 * Arguments for resolving the base path of a service. It takes no properties, and the service comes from the context.
 */
export type GetBasePath = object;

/**
 * Arguments for resolving the path of an endpoint as it is written to the path constant. Its `endpoint` is the endpoint
 * whose path is passed through `pathModifier` first.
 */
export type GetEndpointPath = { endpoint: ApiEndpoint };

/**
 * Arguments for resolving the directory that the files of a package are written to. Its `packageName` is the package
 * whose dots become `/`, below `outputDir`.
 */
export type GetDirectoryPath = { packageName: string };

/**
 * Arguments for naming the constant that holds an endpoint's path in the API interface companion object. Its `endpoint`
 * is the endpoint whose constant is named: the endpoint name followed by `_path`, in `constantNameCasing`.
 */
export type GetPathConstantName = { endpoint: ApiEndpoint };

/**
 * Arguments for resolving the package of a service's files, with `packageSuffix` applied. It takes no properties, and
 * the service comes from the context.
 */
export type GetPackageName = object;

/**
 * Arguments for naming the response entity class of an endpoint. Its `endpoint` is the endpoint whose class is named:
 * the endpoint name plus `_ResponseEntity`.
 */
export type GetApiResponseEntityName = { endpoint: ApiEndpoint };

/**
 * Arguments for naming the API interface of a service. It takes no properties, and the service comes from the context.
 */
export type GetApiInterfaceName = object;

/**
 * Arguments for naming the delegate interface of a service. It takes no properties, and the service comes from the
 * context.
 */
export type GetApiDelegateInterfaceName = object;

/**
 * Arguments for naming the controller class of a service. It takes no properties, and the service comes from the
 * context.
 */
export type GetApiControllerName = object;

/**
 * Arguments for collecting the parameters of an endpoint, in the order of the generated function signature. Its
 * `endpoint` is the endpoint whose parameters are collected: path, query and header parameters first, then the request
 * body, or one parameter per multipart part for `multipart/form-data`.
 */
export type GetAllParameters = { endpoint: ApiEndpoint };
