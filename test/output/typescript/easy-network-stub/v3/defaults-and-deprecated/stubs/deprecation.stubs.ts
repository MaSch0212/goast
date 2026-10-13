import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const deprecatedOpResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const deprecatedOpNoDescResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const deprecatedParamsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

export class DeprecationStubs extends EasyNetworkStubBase {
  private static readonly DEPRECATED_OP_PATH = 'deprecated-op' as const;
  private static readonly DEPRECATED_OP_NO_DESC_PATH = 'deprecated-op-no-desc' as const;
  private static readonly DEPRECATED_PARAMS_PATH = 'deprecated-params?{withDesc?:string}&{noDesc?:string}&{plain?:string}' as const;

  private readonly _deprecatedOpRequests: (StubRequestInfo<typeof DeprecationStubs.DEPRECATED_OP_PATH, unknown>)[] = [];
  private readonly _deprecatedOpNoDescRequests: (StubRequestInfo<typeof DeprecationStubs.DEPRECATED_OP_NO_DESC_PATH, unknown>)[] = [];
  private readonly _deprecatedParamsRequests: (StubRequestInfo<typeof DeprecationStubs.DEPRECATED_PARAMS_PATH, unknown>)[] = [];

  public get deprecatedOpRequests(): readonly (StubRequestInfo<typeof DeprecationStubs.DEPRECATED_OP_PATH, unknown>)[] {
    return this._deprecatedOpRequests;
  }
  public get deprecatedOpNoDescRequests(): readonly (StubRequestInfo<typeof DeprecationStubs.DEPRECATED_OP_NO_DESC_PATH, unknown>)[] {
    return this._deprecatedOpNoDescRequests;
  }
  public get deprecatedParamsRequests(): readonly (StubRequestInfo<typeof DeprecationStubs.DEPRECATED_PARAMS_PATH, unknown>)[] {
    return this._deprecatedParamsRequests;
  }

  public stubDeprecatedOp(response: StrictRouteResponseCallback<
      unknown,
      typeof DeprecationStubs.DEPRECATED_OP_PATH,
      typeof deprecatedOpResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      DeprecationStubs.DEPRECATED_OP_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._deprecatedOpRequests.push(request);
        }
        throw await response(deprecatedOpResponder, request);
      }
    );
    return this;
  }

  public stubDeprecatedOpNoDesc(response: StrictRouteResponseCallback<
      unknown,
      typeof DeprecationStubs.DEPRECATED_OP_NO_DESC_PATH,
      typeof deprecatedOpNoDescResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      DeprecationStubs.DEPRECATED_OP_NO_DESC_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._deprecatedOpNoDescRequests.push(request);
        }
        throw await response(deprecatedOpNoDescResponder, request);
      }
    );
    return this;
  }

  public stubDeprecatedParams(response: StrictRouteResponseCallback<
      unknown,
      typeof DeprecationStubs.DEPRECATED_PARAMS_PATH,
      typeof deprecatedParamsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      DeprecationStubs.DEPRECATED_PARAMS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._deprecatedParamsRequests.push(request);
        }
        throw await response(deprecatedParamsResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._deprecatedOpRequests.length = 0;
    this._deprecatedOpNoDescRequests.length = 0;
    this._deprecatedParamsRequests.length = 0;
    super.reset();
  }
}
