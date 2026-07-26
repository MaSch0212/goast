import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const bodyParamResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const formDataParamsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const fileUploadResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const queryParamsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

export class ParametersStubs extends EasyNetworkStubBase {
  private static readonly BODY_PARAM_PATH = 'body' as const;
  private static readonly FORM_DATA_PARAMS_PATH = 'form' as const;
  private static readonly FILE_UPLOAD_PATH = 'upload' as const;
  private static readonly QUERY_PARAMS_PATH = 'query?{tags?:}&{ids?:}' as const;

  private readonly _bodyParamRequests: (StubRequestInfo<typeof ParametersStubs.BODY_PARAM_PATH, unknown>)[] = [];
  private readonly _formDataParamsRequests: (StubRequestInfo<typeof ParametersStubs.FORM_DATA_PARAMS_PATH, unknown>)[] = [];
  private readonly _fileUploadRequests: (StubRequestInfo<typeof ParametersStubs.FILE_UPLOAD_PATH, unknown>)[] = [];
  private readonly _queryParamsRequests: (StubRequestInfo<typeof ParametersStubs.QUERY_PARAMS_PATH, unknown>)[] = [];

  public get bodyParamRequests(): readonly (StubRequestInfo<typeof ParametersStubs.BODY_PARAM_PATH, unknown>)[] {
    return this._bodyParamRequests;
  }
  public get formDataParamsRequests(): readonly (StubRequestInfo<typeof ParametersStubs.FORM_DATA_PARAMS_PATH, unknown>)[] {
    return this._formDataParamsRequests;
  }
  public get fileUploadRequests(): readonly (StubRequestInfo<typeof ParametersStubs.FILE_UPLOAD_PATH, unknown>)[] {
    return this._fileUploadRequests;
  }
  public get queryParamsRequests(): readonly (StubRequestInfo<typeof ParametersStubs.QUERY_PARAMS_PATH, unknown>)[] {
    return this._queryParamsRequests;
  }

  public stubBodyParam(response: StrictRouteResponseCallback<
      unknown,
      typeof ParametersStubs.BODY_PARAM_PATH,
      typeof bodyParamResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'POST',
      ParametersStubs.BODY_PARAM_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._bodyParamRequests.push(request);
        }
        throw await response(bodyParamResponder, request);
      }
    );
    return this;
  }

  public stubFormDataParams(response: StrictRouteResponseCallback<
      unknown,
      typeof ParametersStubs.FORM_DATA_PARAMS_PATH,
      typeof formDataParamsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'POST',
      ParametersStubs.FORM_DATA_PARAMS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._formDataParamsRequests.push(request);
        }
        throw await response(formDataParamsResponder, request);
      }
    );
    return this;
  }

  public stubFileUpload(response: StrictRouteResponseCallback<
      unknown,
      typeof ParametersStubs.FILE_UPLOAD_PATH,
      typeof fileUploadResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'POST',
      ParametersStubs.FILE_UPLOAD_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._fileUploadRequests.push(request);
        }
        throw await response(fileUploadResponder, request);
      }
    );
    return this;
  }

  public stubQueryParams(response: StrictRouteResponseCallback<
      unknown,
      typeof ParametersStubs.QUERY_PARAMS_PATH,
      typeof queryParamsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ParametersStubs.QUERY_PARAMS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._queryParamsRequests.push(request);
        }
        throw await response(queryParamsResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._bodyParamRequests.length = 0;
    this._formDataParamsRequests.length = 0;
    this._fileUploadRequests.length = 0;
    this._queryParamsRequests.length = 0;
    super.reset();
  }
}
