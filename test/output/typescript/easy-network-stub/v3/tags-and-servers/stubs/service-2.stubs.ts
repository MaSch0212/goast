import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const untaggedResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const pathServerResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const opServerResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

export class Service2Stubs extends EasyNetworkStubBase {
  private static readonly UNTAGGED_PATH = 'untagged' as const;
  private static readonly PATH_SERVER_PATH = 'path-server' as const;
  private static readonly OP_SERVER_PATH = 'op-server' as const;

  private readonly _untaggedRequests: (StubRequestInfo<typeof Service2Stubs.UNTAGGED_PATH, unknown>)[] = [];
  private readonly _pathServerRequests: (StubRequestInfo<typeof Service2Stubs.PATH_SERVER_PATH, unknown>)[] = [];
  private readonly _opServerRequests: (StubRequestInfo<typeof Service2Stubs.OP_SERVER_PATH, unknown>)[] = [];

  public get untaggedRequests(): readonly (StubRequestInfo<typeof Service2Stubs.UNTAGGED_PATH, unknown>)[] {
    return this._untaggedRequests;
  }
  public get pathServerRequests(): readonly (StubRequestInfo<typeof Service2Stubs.PATH_SERVER_PATH, unknown>)[] {
    return this._pathServerRequests;
  }
  public get opServerRequests(): readonly (StubRequestInfo<typeof Service2Stubs.OP_SERVER_PATH, unknown>)[] {
    return this._opServerRequests;
  }

  public stubUntagged(response: StrictRouteResponseCallback<
      unknown,
      typeof Service2Stubs.UNTAGGED_PATH,
      typeof untaggedResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      Service2Stubs.UNTAGGED_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._untaggedRequests.push(request);
        }
        throw await response(untaggedResponder, request);
      }
    );
    return this;
  }

  public stubPathServer(response: StrictRouteResponseCallback<
      unknown,
      typeof Service2Stubs.PATH_SERVER_PATH,
      typeof pathServerResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      Service2Stubs.PATH_SERVER_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._pathServerRequests.push(request);
        }
        throw await response(pathServerResponder, request);
      }
    );
    return this;
  }

  public stubOpServer(response: StrictRouteResponseCallback<
      unknown,
      typeof Service2Stubs.OP_SERVER_PATH,
      typeof opServerResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      Service2Stubs.OP_SERVER_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._opServerRequests.push(request);
        }
        throw await response(opServerResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._untaggedRequests.length = 0;
    this._pathServerRequests.length = 0;
    this._opServerRequests.length = 0;
    super.reset();
  }
}
