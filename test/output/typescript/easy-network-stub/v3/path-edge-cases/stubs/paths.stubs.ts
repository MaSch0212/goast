import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const overlapTemplatedResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const overlapLiteralResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const withDotResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const withDashResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const withUnderscoreResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const withTildeResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const withColonResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const withAtResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const trailingSlashResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const paramOnlyPathResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const threeParamsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const caseVarietyResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const veryDeepPathResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

export class PathsStubs extends EasyNetworkStubBase {
  private static readonly OVERLAP_TEMPLATED_PATH = 'overlap/{id:string}' as const;
  private static readonly OVERLAP_LITERAL_PATH = 'overlap/fixed' as const;
  private static readonly WITH_DOT_PATH = 'with.dot' as const;
  private static readonly WITH_DASH_PATH = 'with-dash' as const;
  private static readonly WITH_UNDERSCORE_PATH = 'with_underscore' as const;
  private static readonly WITH_TILDE_PATH = 'with~tilde' as const;
  private static readonly WITH_COLON_PATH = 'with:colon' as const;
  private static readonly WITH_AT_PATH = 'with@at' as const;
  private static readonly TRAILING_SLASH_PATH = 'trailing/' as const;
  private static readonly PARAM_ONLY_PATH_PATH = '{id:string}' as const;
  private static readonly THREE_PARAMS_PATH = 'a/{p1:string}/b/{p2:string}/c/{p3:string}' as const;
  private static readonly CASE_VARIETY_PATH = 'UPPER/Mixed/lower' as const;
  private static readonly VERY_DEEP_PATH_PATH = 'very/deep/nested/path/with/many/segments/here' as const;

  private readonly _overlapTemplatedRequests: (StubRequestInfo<typeof PathsStubs.OVERLAP_TEMPLATED_PATH, unknown>)[] = [];
  private readonly _overlapLiteralRequests: (StubRequestInfo<typeof PathsStubs.OVERLAP_LITERAL_PATH, unknown>)[] = [];
  private readonly _withDotRequests: (StubRequestInfo<typeof PathsStubs.WITH_DOT_PATH, unknown>)[] = [];
  private readonly _withDashRequests: (StubRequestInfo<typeof PathsStubs.WITH_DASH_PATH, unknown>)[] = [];
  private readonly _withUnderscoreRequests: (StubRequestInfo<typeof PathsStubs.WITH_UNDERSCORE_PATH, unknown>)[] = [];
  private readonly _withTildeRequests: (StubRequestInfo<typeof PathsStubs.WITH_TILDE_PATH, unknown>)[] = [];
  private readonly _withColonRequests: (StubRequestInfo<typeof PathsStubs.WITH_COLON_PATH, unknown>)[] = [];
  private readonly _withAtRequests: (StubRequestInfo<typeof PathsStubs.WITH_AT_PATH, unknown>)[] = [];
  private readonly _trailingSlashRequests: (StubRequestInfo<typeof PathsStubs.TRAILING_SLASH_PATH, unknown>)[] = [];
  private readonly _paramOnlyPathRequests: (StubRequestInfo<typeof PathsStubs.PARAM_ONLY_PATH_PATH, unknown>)[] = [];
  private readonly _threeParamsRequests: (StubRequestInfo<typeof PathsStubs.THREE_PARAMS_PATH, unknown>)[] = [];
  private readonly _caseVarietyRequests: (StubRequestInfo<typeof PathsStubs.CASE_VARIETY_PATH, unknown>)[] = [];
  private readonly _veryDeepPathRequests: (StubRequestInfo<typeof PathsStubs.VERY_DEEP_PATH_PATH, unknown>)[] = [];

  public get overlapTemplatedRequests(): readonly (StubRequestInfo<typeof PathsStubs.OVERLAP_TEMPLATED_PATH, unknown>)[] {
    return this._overlapTemplatedRequests;
  }
  public get overlapLiteralRequests(): readonly (StubRequestInfo<typeof PathsStubs.OVERLAP_LITERAL_PATH, unknown>)[] {
    return this._overlapLiteralRequests;
  }
  public get withDotRequests(): readonly (StubRequestInfo<typeof PathsStubs.WITH_DOT_PATH, unknown>)[] {
    return this._withDotRequests;
  }
  public get withDashRequests(): readonly (StubRequestInfo<typeof PathsStubs.WITH_DASH_PATH, unknown>)[] {
    return this._withDashRequests;
  }
  public get withUnderscoreRequests(): readonly (StubRequestInfo<typeof PathsStubs.WITH_UNDERSCORE_PATH, unknown>)[] {
    return this._withUnderscoreRequests;
  }
  public get withTildeRequests(): readonly (StubRequestInfo<typeof PathsStubs.WITH_TILDE_PATH, unknown>)[] {
    return this._withTildeRequests;
  }
  public get withColonRequests(): readonly (StubRequestInfo<typeof PathsStubs.WITH_COLON_PATH, unknown>)[] {
    return this._withColonRequests;
  }
  public get withAtRequests(): readonly (StubRequestInfo<typeof PathsStubs.WITH_AT_PATH, unknown>)[] {
    return this._withAtRequests;
  }
  public get trailingSlashRequests(): readonly (StubRequestInfo<typeof PathsStubs.TRAILING_SLASH_PATH, unknown>)[] {
    return this._trailingSlashRequests;
  }
  public get paramOnlyPathRequests(): readonly (StubRequestInfo<typeof PathsStubs.PARAM_ONLY_PATH_PATH, unknown>)[] {
    return this._paramOnlyPathRequests;
  }
  public get threeParamsRequests(): readonly (StubRequestInfo<typeof PathsStubs.THREE_PARAMS_PATH, unknown>)[] {
    return this._threeParamsRequests;
  }
  public get caseVarietyRequests(): readonly (StubRequestInfo<typeof PathsStubs.CASE_VARIETY_PATH, unknown>)[] {
    return this._caseVarietyRequests;
  }
  public get veryDeepPathRequests(): readonly (StubRequestInfo<typeof PathsStubs.VERY_DEEP_PATH_PATH, unknown>)[] {
    return this._veryDeepPathRequests;
  }

  public stubOverlapTemplated(response: StrictRouteResponseCallback<
      unknown,
      typeof PathsStubs.OVERLAP_TEMPLATED_PATH,
      typeof overlapTemplatedResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      PathsStubs.OVERLAP_TEMPLATED_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._overlapTemplatedRequests.push(request);
        }
        throw await response(overlapTemplatedResponder, request);
      }
    );
    return this;
  }

  public stubOverlapLiteral(response: StrictRouteResponseCallback<
      unknown,
      typeof PathsStubs.OVERLAP_LITERAL_PATH,
      typeof overlapLiteralResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      PathsStubs.OVERLAP_LITERAL_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._overlapLiteralRequests.push(request);
        }
        throw await response(overlapLiteralResponder, request);
      }
    );
    return this;
  }

  public stubWithDot(response: StrictRouteResponseCallback<
      unknown,
      typeof PathsStubs.WITH_DOT_PATH,
      typeof withDotResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      PathsStubs.WITH_DOT_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._withDotRequests.push(request);
        }
        throw await response(withDotResponder, request);
      }
    );
    return this;
  }

  public stubWithDash(response: StrictRouteResponseCallback<
      unknown,
      typeof PathsStubs.WITH_DASH_PATH,
      typeof withDashResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      PathsStubs.WITH_DASH_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._withDashRequests.push(request);
        }
        throw await response(withDashResponder, request);
      }
    );
    return this;
  }

  public stubWithUnderscore(response: StrictRouteResponseCallback<
      unknown,
      typeof PathsStubs.WITH_UNDERSCORE_PATH,
      typeof withUnderscoreResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      PathsStubs.WITH_UNDERSCORE_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._withUnderscoreRequests.push(request);
        }
        throw await response(withUnderscoreResponder, request);
      }
    );
    return this;
  }

  public stubWithTilde(response: StrictRouteResponseCallback<
      unknown,
      typeof PathsStubs.WITH_TILDE_PATH,
      typeof withTildeResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      PathsStubs.WITH_TILDE_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._withTildeRequests.push(request);
        }
        throw await response(withTildeResponder, request);
      }
    );
    return this;
  }

  public stubWithColon(response: StrictRouteResponseCallback<
      unknown,
      typeof PathsStubs.WITH_COLON_PATH,
      typeof withColonResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      PathsStubs.WITH_COLON_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._withColonRequests.push(request);
        }
        throw await response(withColonResponder, request);
      }
    );
    return this;
  }

  public stubWithAt(response: StrictRouteResponseCallback<
      unknown,
      typeof PathsStubs.WITH_AT_PATH,
      typeof withAtResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      PathsStubs.WITH_AT_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._withAtRequests.push(request);
        }
        throw await response(withAtResponder, request);
      }
    );
    return this;
  }

  public stubTrailingSlash(response: StrictRouteResponseCallback<
      unknown,
      typeof PathsStubs.TRAILING_SLASH_PATH,
      typeof trailingSlashResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      PathsStubs.TRAILING_SLASH_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._trailingSlashRequests.push(request);
        }
        throw await response(trailingSlashResponder, request);
      }
    );
    return this;
  }

  public stubParamOnlyPath(response: StrictRouteResponseCallback<
      unknown,
      typeof PathsStubs.PARAM_ONLY_PATH_PATH,
      typeof paramOnlyPathResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      PathsStubs.PARAM_ONLY_PATH_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._paramOnlyPathRequests.push(request);
        }
        throw await response(paramOnlyPathResponder, request);
      }
    );
    return this;
  }

  public stubThreeParams(response: StrictRouteResponseCallback<
      unknown,
      typeof PathsStubs.THREE_PARAMS_PATH,
      typeof threeParamsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      PathsStubs.THREE_PARAMS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._threeParamsRequests.push(request);
        }
        throw await response(threeParamsResponder, request);
      }
    );
    return this;
  }

  public stubCaseVariety(response: StrictRouteResponseCallback<
      unknown,
      typeof PathsStubs.CASE_VARIETY_PATH,
      typeof caseVarietyResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      PathsStubs.CASE_VARIETY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._caseVarietyRequests.push(request);
        }
        throw await response(caseVarietyResponder, request);
      }
    );
    return this;
  }

  public stubVeryDeepPath(response: StrictRouteResponseCallback<
      unknown,
      typeof PathsStubs.VERY_DEEP_PATH_PATH,
      typeof veryDeepPathResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      PathsStubs.VERY_DEEP_PATH_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._veryDeepPathRequests.push(request);
        }
        throw await response(veryDeepPathResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._overlapTemplatedRequests.length = 0;
    this._overlapLiteralRequests.length = 0;
    this._withDotRequests.length = 0;
    this._withDashRequests.length = 0;
    this._withUnderscoreRequests.length = 0;
    this._withTildeRequests.length = 0;
    this._withColonRequests.length = 0;
    this._withAtRequests.length = 0;
    this._trailingSlashRequests.length = 0;
    this._paramOnlyPathRequests.length = 0;
    this._threeParamsRequests.length = 0;
    this._caseVarietyRequests.length = 0;
    this._veryDeepPathRequests.length = 0;
    super.reset();
  }
}
