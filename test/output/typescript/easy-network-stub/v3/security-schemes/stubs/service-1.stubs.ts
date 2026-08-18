import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const inheritsSecurityResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const overridesSecurityResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const noSecurityResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const multiSecurityResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const andSecurityResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const scopedSecurityResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

export class Service1Stubs extends EasyNetworkStubBase {
  private static readonly INHERITS_SECURITY_PATH = 'inherits-security' as const;
  private static readonly OVERRIDES_SECURITY_PATH = 'overrides-security' as const;
  private static readonly NO_SECURITY_PATH = 'no-security' as const;
  private static readonly MULTI_SECURITY_PATH = 'multi-security' as const;
  private static readonly AND_SECURITY_PATH = 'and-security' as const;
  private static readonly SCOPED_SECURITY_PATH = 'scoped' as const;

  private readonly _inheritsSecurityRequests: (StubRequestInfo<typeof Service1Stubs.INHERITS_SECURITY_PATH, unknown>)[] = [];
  private readonly _overridesSecurityRequests: (StubRequestInfo<typeof Service1Stubs.OVERRIDES_SECURITY_PATH, unknown>)[] = [];
  private readonly _noSecurityRequests: (StubRequestInfo<typeof Service1Stubs.NO_SECURITY_PATH, unknown>)[] = [];
  private readonly _multiSecurityRequests: (StubRequestInfo<typeof Service1Stubs.MULTI_SECURITY_PATH, unknown>)[] = [];
  private readonly _andSecurityRequests: (StubRequestInfo<typeof Service1Stubs.AND_SECURITY_PATH, unknown>)[] = [];
  private readonly _scopedSecurityRequests: (StubRequestInfo<typeof Service1Stubs.SCOPED_SECURITY_PATH, unknown>)[] = [];

  public get inheritsSecurityRequests(): readonly (StubRequestInfo<typeof Service1Stubs.INHERITS_SECURITY_PATH, unknown>)[] {
    return this._inheritsSecurityRequests;
  }
  public get overridesSecurityRequests(): readonly (StubRequestInfo<typeof Service1Stubs.OVERRIDES_SECURITY_PATH, unknown>)[] {
    return this._overridesSecurityRequests;
  }
  public get noSecurityRequests(): readonly (StubRequestInfo<typeof Service1Stubs.NO_SECURITY_PATH, unknown>)[] {
    return this._noSecurityRequests;
  }
  public get multiSecurityRequests(): readonly (StubRequestInfo<typeof Service1Stubs.MULTI_SECURITY_PATH, unknown>)[] {
    return this._multiSecurityRequests;
  }
  public get andSecurityRequests(): readonly (StubRequestInfo<typeof Service1Stubs.AND_SECURITY_PATH, unknown>)[] {
    return this._andSecurityRequests;
  }
  public get scopedSecurityRequests(): readonly (StubRequestInfo<typeof Service1Stubs.SCOPED_SECURITY_PATH, unknown>)[] {
    return this._scopedSecurityRequests;
  }

  public stubInheritsSecurity(response: StrictRouteResponseCallback<
      unknown,
      typeof Service1Stubs.INHERITS_SECURITY_PATH,
      typeof inheritsSecurityResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      Service1Stubs.INHERITS_SECURITY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._inheritsSecurityRequests.push(request);
        }
        throw await response(inheritsSecurityResponder, request);
      }
    );
    return this;
  }

  public stubOverridesSecurity(response: StrictRouteResponseCallback<
      unknown,
      typeof Service1Stubs.OVERRIDES_SECURITY_PATH,
      typeof overridesSecurityResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      Service1Stubs.OVERRIDES_SECURITY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._overridesSecurityRequests.push(request);
        }
        throw await response(overridesSecurityResponder, request);
      }
    );
    return this;
  }

  public stubNoSecurity(response: StrictRouteResponseCallback<
      unknown,
      typeof Service1Stubs.NO_SECURITY_PATH,
      typeof noSecurityResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      Service1Stubs.NO_SECURITY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._noSecurityRequests.push(request);
        }
        throw await response(noSecurityResponder, request);
      }
    );
    return this;
  }

  public stubMultiSecurity(response: StrictRouteResponseCallback<
      unknown,
      typeof Service1Stubs.MULTI_SECURITY_PATH,
      typeof multiSecurityResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      Service1Stubs.MULTI_SECURITY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._multiSecurityRequests.push(request);
        }
        throw await response(multiSecurityResponder, request);
      }
    );
    return this;
  }

  public stubAndSecurity(response: StrictRouteResponseCallback<
      unknown,
      typeof Service1Stubs.AND_SECURITY_PATH,
      typeof andSecurityResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      Service1Stubs.AND_SECURITY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._andSecurityRequests.push(request);
        }
        throw await response(andSecurityResponder, request);
      }
    );
    return this;
  }

  public stubScopedSecurity(response: StrictRouteResponseCallback<
      unknown,
      typeof Service1Stubs.SCOPED_SECURITY_PATH,
      typeof scopedSecurityResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      Service1Stubs.SCOPED_SECURITY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._scopedSecurityRequests.push(request);
        }
        throw await response(scopedSecurityResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._inheritsSecurityRequests.length = 0;
    this._overridesSecurityRequests.length = 0;
    this._noSecurityRequests.length = 0;
    this._multiSecurityRequests.length = 0;
    this._andSecurityRequests.length = 0;
    this._scopedSecurityRequests.length = 0;
    super.reset();
  }
}
