import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const inheritsParamsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const inheritsAndAddsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const overridesParamResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const refParamResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

export class InheritanceStubs extends EasyNetworkStubBase {
  private static readonly INHERITS_PARAMS_PATH = 'inherited/{id:string}?{common?:string}' as const;
  private static readonly INHERITS_AND_ADDS_PATH = 'inherited/{id:string}?{common?:string}&{extra?:string}' as const;
  private static readonly OVERRIDES_PARAM_PATH = 'overridden/{id:string}?{common?:number}' as const;
  private static readonly REF_PARAM_PATH = 'ref-param/{id:string}?{page?:number}' as const;

  private readonly _inheritsParamsRequests: (StubRequestInfo<typeof InheritanceStubs.INHERITS_PARAMS_PATH, unknown>)[] = [];
  private readonly _inheritsAndAddsRequests: (StubRequestInfo<typeof InheritanceStubs.INHERITS_AND_ADDS_PATH, unknown>)[] = [];
  private readonly _overridesParamRequests: (StubRequestInfo<typeof InheritanceStubs.OVERRIDES_PARAM_PATH, unknown>)[] = [];
  private readonly _refParamRequests: (StubRequestInfo<typeof InheritanceStubs.REF_PARAM_PATH, unknown>)[] = [];

  public get inheritsParamsRequests(): readonly (StubRequestInfo<typeof InheritanceStubs.INHERITS_PARAMS_PATH, unknown>)[] {
    return this._inheritsParamsRequests;
  }
  public get inheritsAndAddsRequests(): readonly (StubRequestInfo<typeof InheritanceStubs.INHERITS_AND_ADDS_PATH, unknown>)[] {
    return this._inheritsAndAddsRequests;
  }
  public get overridesParamRequests(): readonly (StubRequestInfo<typeof InheritanceStubs.OVERRIDES_PARAM_PATH, unknown>)[] {
    return this._overridesParamRequests;
  }
  public get refParamRequests(): readonly (StubRequestInfo<typeof InheritanceStubs.REF_PARAM_PATH, unknown>)[] {
    return this._refParamRequests;
  }

  public stubInheritsParams(response: StrictRouteResponseCallback<
      unknown,
      typeof InheritanceStubs.INHERITS_PARAMS_PATH,
      typeof inheritsParamsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      InheritanceStubs.INHERITS_PARAMS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._inheritsParamsRequests.push(request);
        }
        throw await response(inheritsParamsResponder, request);
      }
    );
    return this;
  }

  public stubInheritsAndAdds(response: StrictRouteResponseCallback<
      unknown,
      typeof InheritanceStubs.INHERITS_AND_ADDS_PATH,
      typeof inheritsAndAddsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'POST',
      InheritanceStubs.INHERITS_AND_ADDS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._inheritsAndAddsRequests.push(request);
        }
        throw await response(inheritsAndAddsResponder, request);
      }
    );
    return this;
  }

  public stubOverridesParam(response: StrictRouteResponseCallback<
      unknown,
      typeof InheritanceStubs.OVERRIDES_PARAM_PATH,
      typeof overridesParamResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      InheritanceStubs.OVERRIDES_PARAM_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._overridesParamRequests.push(request);
        }
        throw await response(overridesParamResponder, request);
      }
    );
    return this;
  }

  public stubRefParam(response: StrictRouteResponseCallback<
      unknown,
      typeof InheritanceStubs.REF_PARAM_PATH,
      typeof refParamResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      InheritanceStubs.REF_PARAM_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._refParamRequests.push(request);
        }
        throw await response(refParamResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._inheritsParamsRequests.length = 0;
    this._inheritsAndAddsRequests.length = 0;
    this._overridesParamRequests.length = 0;
    this._refParamRequests.length = 0;
    super.reset();
  }
}
