import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const formArrayResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const formArrayNoExplodeResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const formObjectResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const spaceDelimitedResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const pipeDelimitedResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const deepObjectResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const simplePathResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const labelPathResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const matrixPathResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const simpleHeaderResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

export class StylesStubs extends EasyNetworkStubBase {
  private static readonly FORM_ARRAY_PATH = 'query-form-array?{tags?:string[]}' as const;
  private static readonly FORM_ARRAY_NO_EXPLODE_PATH = 'query-form-array-no-explode?{tags?:string[]}' as const;
  private static readonly FORM_OBJECT_PATH = 'query-form-object?{coordinates?:{\n  label?: string;\n  count?: number;\n}}' as const;
  private static readonly SPACE_DELIMITED_PATH = 'query-space-delimited?{tags?:string[]}' as const;
  private static readonly PIPE_DELIMITED_PATH = 'query-pipe-delimited?{tags?:string[]}' as const;
  private static readonly DEEP_OBJECT_PATH = 'query-deep-object?{filter?:{\n  label?: string;\n  count?: number;\n}}' as const;
  private static readonly SIMPLE_PATH_PATH = 'simple-path/{values:string[]}' as const;
  private static readonly LABEL_PATH_PATH = 'label-path/{values:string[]}' as const;
  private static readonly MATRIX_PATH_PATH = 'matrix-path/{values:string[]}' as const;
  private static readonly SIMPLE_HEADER_PATH = 'simple-header' as const;

  private readonly _formArrayRequests: (StubRequestInfo<typeof StylesStubs.FORM_ARRAY_PATH, unknown>)[] = [];
  private readonly _formArrayNoExplodeRequests: (StubRequestInfo<typeof StylesStubs.FORM_ARRAY_NO_EXPLODE_PATH, unknown>)[] = [];
  private readonly _formObjectRequests: (StubRequestInfo<typeof StylesStubs.FORM_OBJECT_PATH, unknown>)[] = [];
  private readonly _spaceDelimitedRequests: (StubRequestInfo<typeof StylesStubs.SPACE_DELIMITED_PATH, unknown>)[] = [];
  private readonly _pipeDelimitedRequests: (StubRequestInfo<typeof StylesStubs.PIPE_DELIMITED_PATH, unknown>)[] = [];
  private readonly _deepObjectRequests: (StubRequestInfo<typeof StylesStubs.DEEP_OBJECT_PATH, unknown>)[] = [];
  private readonly _simplePathRequests: (StubRequestInfo<typeof StylesStubs.SIMPLE_PATH_PATH, unknown>)[] = [];
  private readonly _labelPathRequests: (StubRequestInfo<typeof StylesStubs.LABEL_PATH_PATH, unknown>)[] = [];
  private readonly _matrixPathRequests: (StubRequestInfo<typeof StylesStubs.MATRIX_PATH_PATH, unknown>)[] = [];
  private readonly _simpleHeaderRequests: (StubRequestInfo<typeof StylesStubs.SIMPLE_HEADER_PATH, unknown>)[] = [];

  public get formArrayRequests(): readonly (StubRequestInfo<typeof StylesStubs.FORM_ARRAY_PATH, unknown>)[] {
    return this._formArrayRequests;
  }
  public get formArrayNoExplodeRequests(): readonly (StubRequestInfo<typeof StylesStubs.FORM_ARRAY_NO_EXPLODE_PATH, unknown>)[] {
    return this._formArrayNoExplodeRequests;
  }
  public get formObjectRequests(): readonly (StubRequestInfo<typeof StylesStubs.FORM_OBJECT_PATH, unknown>)[] {
    return this._formObjectRequests;
  }
  public get spaceDelimitedRequests(): readonly (StubRequestInfo<typeof StylesStubs.SPACE_DELIMITED_PATH, unknown>)[] {
    return this._spaceDelimitedRequests;
  }
  public get pipeDelimitedRequests(): readonly (StubRequestInfo<typeof StylesStubs.PIPE_DELIMITED_PATH, unknown>)[] {
    return this._pipeDelimitedRequests;
  }
  public get deepObjectRequests(): readonly (StubRequestInfo<typeof StylesStubs.DEEP_OBJECT_PATH, unknown>)[] {
    return this._deepObjectRequests;
  }
  public get simplePathRequests(): readonly (StubRequestInfo<typeof StylesStubs.SIMPLE_PATH_PATH, unknown>)[] {
    return this._simplePathRequests;
  }
  public get labelPathRequests(): readonly (StubRequestInfo<typeof StylesStubs.LABEL_PATH_PATH, unknown>)[] {
    return this._labelPathRequests;
  }
  public get matrixPathRequests(): readonly (StubRequestInfo<typeof StylesStubs.MATRIX_PATH_PATH, unknown>)[] {
    return this._matrixPathRequests;
  }
  public get simpleHeaderRequests(): readonly (StubRequestInfo<typeof StylesStubs.SIMPLE_HEADER_PATH, unknown>)[] {
    return this._simpleHeaderRequests;
  }

  public stubFormArray(response: StrictRouteResponseCallback<
      unknown,
      typeof StylesStubs.FORM_ARRAY_PATH,
      typeof formArrayResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      StylesStubs.FORM_ARRAY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._formArrayRequests.push(request);
        }
        throw await response(formArrayResponder, request);
      }
    );
    return this;
  }

  public stubFormArrayNoExplode(response: StrictRouteResponseCallback<
      unknown,
      typeof StylesStubs.FORM_ARRAY_NO_EXPLODE_PATH,
      typeof formArrayNoExplodeResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      StylesStubs.FORM_ARRAY_NO_EXPLODE_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._formArrayNoExplodeRequests.push(request);
        }
        throw await response(formArrayNoExplodeResponder, request);
      }
    );
    return this;
  }

  public stubFormObject(response: StrictRouteResponseCallback<
      unknown,
      typeof StylesStubs.FORM_OBJECT_PATH,
      typeof formObjectResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      StylesStubs.FORM_OBJECT_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._formObjectRequests.push(request);
        }
        throw await response(formObjectResponder, request);
      }
    );
    return this;
  }

  public stubSpaceDelimited(response: StrictRouteResponseCallback<
      unknown,
      typeof StylesStubs.SPACE_DELIMITED_PATH,
      typeof spaceDelimitedResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      StylesStubs.SPACE_DELIMITED_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._spaceDelimitedRequests.push(request);
        }
        throw await response(spaceDelimitedResponder, request);
      }
    );
    return this;
  }

  public stubPipeDelimited(response: StrictRouteResponseCallback<
      unknown,
      typeof StylesStubs.PIPE_DELIMITED_PATH,
      typeof pipeDelimitedResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      StylesStubs.PIPE_DELIMITED_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._pipeDelimitedRequests.push(request);
        }
        throw await response(pipeDelimitedResponder, request);
      }
    );
    return this;
  }

  public stubDeepObject(response: StrictRouteResponseCallback<
      unknown,
      typeof StylesStubs.DEEP_OBJECT_PATH,
      typeof deepObjectResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      StylesStubs.DEEP_OBJECT_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._deepObjectRequests.push(request);
        }
        throw await response(deepObjectResponder, request);
      }
    );
    return this;
  }

  public stubSimplePath(response: StrictRouteResponseCallback<
      unknown,
      typeof StylesStubs.SIMPLE_PATH_PATH,
      typeof simplePathResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      StylesStubs.SIMPLE_PATH_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._simplePathRequests.push(request);
        }
        throw await response(simplePathResponder, request);
      }
    );
    return this;
  }

  public stubLabelPath(response: StrictRouteResponseCallback<
      unknown,
      typeof StylesStubs.LABEL_PATH_PATH,
      typeof labelPathResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      StylesStubs.LABEL_PATH_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._labelPathRequests.push(request);
        }
        throw await response(labelPathResponder, request);
      }
    );
    return this;
  }

  public stubMatrixPath(response: StrictRouteResponseCallback<
      unknown,
      typeof StylesStubs.MATRIX_PATH_PATH,
      typeof matrixPathResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      StylesStubs.MATRIX_PATH_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._matrixPathRequests.push(request);
        }
        throw await response(matrixPathResponder, request);
      }
    );
    return this;
  }

  public stubSimpleHeader(response: StrictRouteResponseCallback<
      unknown,
      typeof StylesStubs.SIMPLE_HEADER_PATH,
      typeof simpleHeaderResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      StylesStubs.SIMPLE_HEADER_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._simpleHeaderRequests.push(request);
        }
        throw await response(simpleHeaderResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._formArrayRequests.length = 0;
    this._formArrayNoExplodeRequests.length = 0;
    this._formObjectRequests.length = 0;
    this._spaceDelimitedRequests.length = 0;
    this._pipeDelimitedRequests.length = 0;
    this._deepObjectRequests.length = 0;
    this._simplePathRequests.length = 0;
    this._labelPathRequests.length = 0;
    this._matrixPathRequests.length = 0;
    this._simpleHeaderRequests.length = 0;
    super.reset();
  }
}
