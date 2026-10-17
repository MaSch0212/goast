import type { ApiEndpoint } from '@goast/core';

import type { ParameterPlan, StrictResult } from '../shared/index.ts';

/** Everything the generator works out about one endpoint of a service, once. */
export type EndpointInfo = {
  endpoint: ApiEndpoint;
  plans: ParameterPlan[];
  result: StrictResult;
  /** The name of the (abstract) endpoint class. */
  endpointName: string;
  /** The name of the abstract handler method. */
  handlerName: string;
};

export type GetNamespace = object;

export type GetSupportNamespace = object;

export type GetDirectoryPath = object;

export type GetEndpointName = { endpoint: ApiEndpoint };

// #region Result files
export type GenerateResultFile = { info: EndpointInfo; dirPath: string; namespace: string };

export type GetResultFileContent = { result: StrictResult };
// #endregion

// #region Endpoint file
export type GenerateEndpointFile = { info: EndpointInfo; dirPath: string; namespace: string };

export type GetEndpointFileContent = { info: EndpointInfo };

export type GetEndpoint = { info: EndpointInfo };

export type GetConfigureMethod = { info: EndpointInfo };

export type GetConfigureEndpointHook = { info: EndpointInfo };

export type GetRoute = { endpoint: ApiEndpoint };

export type GetHandleMethod = { info: EndpointInfo };

export type GetHandleBody = { info: EndpointInfo };

export type GetRawValue = { plan: ParameterPlan; request: string; form: string };

export type GetHandlerMethod = { info: EndpointInfo };
// #endregion

// #region Support files
export type GenerateSupportFiles = object;
// #endregion
