import type { ApiEndpoint } from '@goast/core';

import type { ParameterPlan, StrictResult, StrictResultCase } from '../shared/index.ts';

/** Everything the generator works out about one endpoint of a service, once. */
export type EndpointInfo = {
  endpoint: ApiEndpoint;
  plans: ParameterPlan[];
  result: StrictResult;
  /** The name of the (public) action method. */
  actionName: string;
  /** The name of the abstract handler method. */
  handlerName: string;
};

export type GetNamespace = object;

export type GetSupportNamespace = object;

export type GetDirectoryPath = object;

export type GetControllerName = object;

// #region Result files
export type GenerateResultFile = { info: EndpointInfo; dirPath: string; namespace: string };

export type GetResultFileContent = { result: StrictResult };
// #endregion

// #region Controller file
export type GenerateControllerFile = {
  dirPath: string;
  namespace: string;
  controllerName: string;
  endpoints: EndpointInfo[];
};

export type GetControllerFileContent = { controllerName: string; endpoints: EndpointInfo[] };

export type GetController = { controllerName: string; endpoints: EndpointInfo[] };

export type GetControllerAttributes = object;

export type GetEndpointMembers = { info: EndpointInfo };

export type GetAction = { info: EndpointInfo };

export type GetActionAttributes = { info: EndpointInfo };

export type GetRouteAttribute = { endpoint: ApiEndpoint };

export type GetProducesAttributes = { result: StrictResult };

export type GetConsumesAttribute = { endpoint: ApiEndpoint };

export type GetActionParameter = { info: EndpointInfo; plan: ParameterPlan };

export type GetBindingAttribute = { plan: ParameterPlan; actionName: string };

export type GetActionBody = { info: EndpointInfo };

export type GetResultSwitch = { info: EndpointInfo; variable: string };

export type GetResultArm = { info: EndpointInfo; resultCase: StrictResultCase; variable: string };

export type GetHandlerMethod = { info: EndpointInfo };
// #endregion

// #region Support files
export type GenerateSupportFiles = object;
// #endregion
