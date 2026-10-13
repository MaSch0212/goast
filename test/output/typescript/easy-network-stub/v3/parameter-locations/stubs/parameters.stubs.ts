import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const twoPathParamsResponder = getStubResponder<{
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

const headerParamsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const cookieParamsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const mixedParamsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const describedParamsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const allowEmptyValueParamResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const reservedCharParamResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

export class ParametersStubs extends EasyNetworkStubBase {
  private static readonly TWO_PATH_PARAMS_PATH = 'path/{id:string}/{sub:number}' as const;
  private static readonly QUERY_PARAMS_PATH = 'query?{requiredString:string}&{optionalString?:string}&{intWithDefault?:number}&{flag?:boolean}' as const;
  private static readonly HEADER_PARAMS_PATH = 'header' as const;
  private static readonly COOKIE_PARAMS_PATH = 'cookie' as const;
  private static readonly MIXED_PARAMS_PATH = 'mixed/{id:string}?{filter?:string}' as const;
  private static readonly DESCRIBED_PARAMS_PATH = 'described?{withDescription?:string}&{withoutDescription?:string}&{withExample?:string}&{withRefSchema?:ParamSchema}' as const;
  private static readonly ALLOW_EMPTY_VALUE_PARAM_PATH = 'empty-value?{search?:string}' as const;
  private static readonly RESERVED_CHAR_PARAM_PATH = 'reserved?{filter?:string}' as const;

  private readonly _twoPathParamsRequests: (StubRequestInfo<typeof ParametersStubs.TWO_PATH_PARAMS_PATH, unknown>)[] = [];
  private readonly _queryParamsRequests: (StubRequestInfo<typeof ParametersStubs.QUERY_PARAMS_PATH, unknown>)[] = [];
  private readonly _headerParamsRequests: (StubRequestInfo<typeof ParametersStubs.HEADER_PARAMS_PATH, unknown>)[] = [];
  private readonly _cookieParamsRequests: (StubRequestInfo<typeof ParametersStubs.COOKIE_PARAMS_PATH, unknown>)[] = [];
  private readonly _mixedParamsRequests: (StubRequestInfo<typeof ParametersStubs.MIXED_PARAMS_PATH, unknown>)[] = [];
  private readonly _describedParamsRequests: (StubRequestInfo<typeof ParametersStubs.DESCRIBED_PARAMS_PATH, unknown>)[] = [];
  private readonly _allowEmptyValueParamRequests: (StubRequestInfo<typeof ParametersStubs.ALLOW_EMPTY_VALUE_PARAM_PATH, unknown>)[] = [];
  private readonly _reservedCharParamRequests: (StubRequestInfo<typeof ParametersStubs.RESERVED_CHAR_PARAM_PATH, unknown>)[] = [];

  public get twoPathParamsRequests(): readonly (StubRequestInfo<typeof ParametersStubs.TWO_PATH_PARAMS_PATH, unknown>)[] {
    return this._twoPathParamsRequests;
  }
  public get queryParamsRequests(): readonly (StubRequestInfo<typeof ParametersStubs.QUERY_PARAMS_PATH, unknown>)[] {
    return this._queryParamsRequests;
  }
  public get headerParamsRequests(): readonly (StubRequestInfo<typeof ParametersStubs.HEADER_PARAMS_PATH, unknown>)[] {
    return this._headerParamsRequests;
  }
  public get cookieParamsRequests(): readonly (StubRequestInfo<typeof ParametersStubs.COOKIE_PARAMS_PATH, unknown>)[] {
    return this._cookieParamsRequests;
  }
  public get mixedParamsRequests(): readonly (StubRequestInfo<typeof ParametersStubs.MIXED_PARAMS_PATH, unknown>)[] {
    return this._mixedParamsRequests;
  }
  public get describedParamsRequests(): readonly (StubRequestInfo<typeof ParametersStubs.DESCRIBED_PARAMS_PATH, unknown>)[] {
    return this._describedParamsRequests;
  }
  public get allowEmptyValueParamRequests(): readonly (StubRequestInfo<typeof ParametersStubs.ALLOW_EMPTY_VALUE_PARAM_PATH, unknown>)[] {
    return this._allowEmptyValueParamRequests;
  }
  public get reservedCharParamRequests(): readonly (StubRequestInfo<typeof ParametersStubs.RESERVED_CHAR_PARAM_PATH, unknown>)[] {
    return this._reservedCharParamRequests;
  }

  public stubTwoPathParams(response: StrictRouteResponseCallback<
      unknown,
      typeof ParametersStubs.TWO_PATH_PARAMS_PATH,
      typeof twoPathParamsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ParametersStubs.TWO_PATH_PARAMS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._twoPathParamsRequests.push(request);
        }
        throw await response(twoPathParamsResponder, request);
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

  public stubHeaderParams(response: StrictRouteResponseCallback<
      unknown,
      typeof ParametersStubs.HEADER_PARAMS_PATH,
      typeof headerParamsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ParametersStubs.HEADER_PARAMS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._headerParamsRequests.push(request);
        }
        throw await response(headerParamsResponder, request);
      }
    );
    return this;
  }

  public stubCookieParams(response: StrictRouteResponseCallback<
      unknown,
      typeof ParametersStubs.COOKIE_PARAMS_PATH,
      typeof cookieParamsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ParametersStubs.COOKIE_PARAMS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._cookieParamsRequests.push(request);
        }
        throw await response(cookieParamsResponder, request);
      }
    );
    return this;
  }

  public stubMixedParams(response: StrictRouteResponseCallback<
      unknown,
      typeof ParametersStubs.MIXED_PARAMS_PATH,
      typeof mixedParamsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ParametersStubs.MIXED_PARAMS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._mixedParamsRequests.push(request);
        }
        throw await response(mixedParamsResponder, request);
      }
    );
    return this;
  }

  public stubDescribedParams(response: StrictRouteResponseCallback<
      unknown,
      typeof ParametersStubs.DESCRIBED_PARAMS_PATH,
      typeof describedParamsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ParametersStubs.DESCRIBED_PARAMS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._describedParamsRequests.push(request);
        }
        throw await response(describedParamsResponder, request);
      }
    );
    return this;
  }

  public stubAllowEmptyValueParam(response: StrictRouteResponseCallback<
      unknown,
      typeof ParametersStubs.ALLOW_EMPTY_VALUE_PARAM_PATH,
      typeof allowEmptyValueParamResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ParametersStubs.ALLOW_EMPTY_VALUE_PARAM_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._allowEmptyValueParamRequests.push(request);
        }
        throw await response(allowEmptyValueParamResponder, request);
      }
    );
    return this;
  }

  public stubReservedCharParam(response: StrictRouteResponseCallback<
      unknown,
      typeof ParametersStubs.RESERVED_CHAR_PARAM_PATH,
      typeof reservedCharParamResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ParametersStubs.RESERVED_CHAR_PARAM_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._reservedCharParamRequests.push(request);
        }
        throw await response(reservedCharParamResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._twoPathParamsRequests.length = 0;
    this._queryParamsRequests.length = 0;
    this._headerParamsRequests.length = 0;
    this._cookieParamsRequests.length = 0;
    this._mixedParamsRequests.length = 0;
    this._describedParamsRequests.length = 0;
    this._allowEmptyValueParamRequests.length = 0;
    this._reservedCharParamRequests.length = 0;
    super.reset();
  }
}
