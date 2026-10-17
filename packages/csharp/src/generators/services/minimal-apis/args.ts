import type { ApiEndpoint } from '@goast/core';

import type { ParameterPlan, StrictResult, StrictResultCase } from '../shared/index.ts';

/** Everything the generator works out about one endpoint of a service, once. */
export type EndpointInfo = {
  endpoint: ApiEndpoint;
  plans: ParameterPlan[];
  result: StrictResult;
  /** The name of the abstract handler method of the API base class. */
  handlerName: string;
  /** The name of the private static method that binds the request, calls the handler and converts its result. */
  methodName: string;
};

export type GetNamespace = object;

export type GetSupportNamespace = object;

export type GetDirectoryPath = object;

export type GetApiName = object;

export type GetExtensionsName = object;

export type GetMapMethodName = object;

// #region Result files
export type GenerateResultFile = { info: EndpointInfo; dirPath: string; namespace: string };

export type GetResultFileContent = { result: StrictResult };
// #endregion

// #region API base file
export type GenerateApiFile = { dirPath: string; namespace: string; apiName: string; endpoints: EndpointInfo[] };

export type GetApiFileContent = { apiName: string; endpoints: EndpointInfo[] };

export type GetApi = { apiName: string; endpoints: EndpointInfo[] };

export type GetHandlerMethod = { info: EndpointInfo };
// #endregion

// #region Extensions file
export type GenerateExtensionsFile = {
  dirPath: string;
  namespace: string;
  apiName: string;
  extensionsName: string;
  endpoints: EndpointInfo[];
};

export type GetExtensionsFileContent = { apiName: string; extensionsName: string; endpoints: EndpointInfo[] };

export type GetExtensions = { apiName: string; extensionsName: string; endpoints: EndpointInfo[] };

export type GetMapMethod = { apiName: string; endpoints: EndpointInfo[] };

export type GetMapMethodBody = { endpoints: EndpointInfo[] };

export type GetRouteMapping = { info: EndpointInfo; group: string };

export type GetMetadataCalls = { info: EndpointInfo };

export type GetProducesCall = { resultCase: StrictResultCase };

export type GetAcceptsCall = { info: EndpointInfo };
// #endregion

// #region Endpoint method
export type GetEndpointMethod = { apiName: string; info: EndpointInfo };

export type GetEndpointParameter = { info: EndpointInfo; plan: ParameterPlan };

export type GetBindingAttribute = { plan: ParameterPlan };

export type GetEndpointMethodBody = { info: EndpointInfo; apiParameter: string; requestParameter: string };

export type GetResultSwitch = { info: EndpointInfo; variable: string };

export type GetResultArm = { info: EndpointInfo; resultCase: StrictResultCase; variable: string };
// #endregion

// #region Support files
export type GenerateSupportFiles = object;
// #endregion
