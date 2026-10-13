import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { Thing } from '../models/thing';
import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const singleHeaderResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const multipleHeadersResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const requiredHeaderResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const deprecatedHeaderResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const refHeaderResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const headersOnNoContentResponder = getStubResponder<{
    204: never;
    401: never;
    403: never;
    500: never;
  }>();

const headersAndBodyResponder = getStubResponder<{
    200: Thing;
    401: never;
    403: never;
    500: never;
  }>();

export class HeadersStubs extends EasyNetworkStubBase {
  private static readonly SINGLE_HEADER_PATH = 'one' as const;
  private static readonly MULTIPLE_HEADERS_PATH = 'many' as const;
  private static readonly REQUIRED_HEADER_PATH = 'required' as const;
  private static readonly DEPRECATED_HEADER_PATH = 'deprecated' as const;
  private static readonly REF_HEADER_PATH = 'ref' as const;
  private static readonly HEADERS_ON_NO_CONTENT_PATH = 'no-content-headers' as const;
  private static readonly HEADERS_AND_BODY_PATH = 'both' as const;

  private readonly _singleHeaderRequests: (StubRequestInfo<typeof HeadersStubs.SINGLE_HEADER_PATH, unknown>)[] = [];
  private readonly _multipleHeadersRequests: (StubRequestInfo<typeof HeadersStubs.MULTIPLE_HEADERS_PATH, unknown>)[] = [];
  private readonly _requiredHeaderRequests: (StubRequestInfo<typeof HeadersStubs.REQUIRED_HEADER_PATH, unknown>)[] = [];
  private readonly _deprecatedHeaderRequests: (StubRequestInfo<typeof HeadersStubs.DEPRECATED_HEADER_PATH, unknown>)[] = [];
  private readonly _refHeaderRequests: (StubRequestInfo<typeof HeadersStubs.REF_HEADER_PATH, unknown>)[] = [];
  private readonly _headersOnNoContentRequests: (StubRequestInfo<typeof HeadersStubs.HEADERS_ON_NO_CONTENT_PATH, unknown>)[] = [];
  private readonly _headersAndBodyRequests: (StubRequestInfo<typeof HeadersStubs.HEADERS_AND_BODY_PATH, unknown>)[] = [];

  public get singleHeaderRequests(): readonly (StubRequestInfo<typeof HeadersStubs.SINGLE_HEADER_PATH, unknown>)[] {
    return this._singleHeaderRequests;
  }
  public get multipleHeadersRequests(): readonly (StubRequestInfo<typeof HeadersStubs.MULTIPLE_HEADERS_PATH, unknown>)[] {
    return this._multipleHeadersRequests;
  }
  public get requiredHeaderRequests(): readonly (StubRequestInfo<typeof HeadersStubs.REQUIRED_HEADER_PATH, unknown>)[] {
    return this._requiredHeaderRequests;
  }
  public get deprecatedHeaderRequests(): readonly (StubRequestInfo<typeof HeadersStubs.DEPRECATED_HEADER_PATH, unknown>)[] {
    return this._deprecatedHeaderRequests;
  }
  public get refHeaderRequests(): readonly (StubRequestInfo<typeof HeadersStubs.REF_HEADER_PATH, unknown>)[] {
    return this._refHeaderRequests;
  }
  public get headersOnNoContentRequests(): readonly (StubRequestInfo<typeof HeadersStubs.HEADERS_ON_NO_CONTENT_PATH, unknown>)[] {
    return this._headersOnNoContentRequests;
  }
  public get headersAndBodyRequests(): readonly (StubRequestInfo<typeof HeadersStubs.HEADERS_AND_BODY_PATH, unknown>)[] {
    return this._headersAndBodyRequests;
  }

  public stubSingleHeader(response: StrictRouteResponseCallback<
      unknown,
      typeof HeadersStubs.SINGLE_HEADER_PATH,
      typeof singleHeaderResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      HeadersStubs.SINGLE_HEADER_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._singleHeaderRequests.push(request);
        }
        throw await response(singleHeaderResponder, request);
      }
    );
    return this;
  }

  public stubMultipleHeaders(response: StrictRouteResponseCallback<
      unknown,
      typeof HeadersStubs.MULTIPLE_HEADERS_PATH,
      typeof multipleHeadersResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      HeadersStubs.MULTIPLE_HEADERS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._multipleHeadersRequests.push(request);
        }
        throw await response(multipleHeadersResponder, request);
      }
    );
    return this;
  }

  public stubRequiredHeader(response: StrictRouteResponseCallback<
      unknown,
      typeof HeadersStubs.REQUIRED_HEADER_PATH,
      typeof requiredHeaderResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      HeadersStubs.REQUIRED_HEADER_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._requiredHeaderRequests.push(request);
        }
        throw await response(requiredHeaderResponder, request);
      }
    );
    return this;
  }

  public stubDeprecatedHeader(response: StrictRouteResponseCallback<
      unknown,
      typeof HeadersStubs.DEPRECATED_HEADER_PATH,
      typeof deprecatedHeaderResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      HeadersStubs.DEPRECATED_HEADER_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._deprecatedHeaderRequests.push(request);
        }
        throw await response(deprecatedHeaderResponder, request);
      }
    );
    return this;
  }

  public stubRefHeader(response: StrictRouteResponseCallback<
      unknown,
      typeof HeadersStubs.REF_HEADER_PATH,
      typeof refHeaderResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      HeadersStubs.REF_HEADER_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._refHeaderRequests.push(request);
        }
        throw await response(refHeaderResponder, request);
      }
    );
    return this;
  }

  public stubHeadersOnNoContent(response: StrictRouteResponseCallback<
      unknown,
      typeof HeadersStubs.HEADERS_ON_NO_CONTENT_PATH,
      typeof headersOnNoContentResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      HeadersStubs.HEADERS_ON_NO_CONTENT_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._headersOnNoContentRequests.push(request);
        }
        throw await response(headersOnNoContentResponder, request);
      }
    );
    return this;
  }

  public stubHeadersAndBody(response: StrictRouteResponseCallback<
      unknown,
      typeof HeadersStubs.HEADERS_AND_BODY_PATH,
      typeof headersAndBodyResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      HeadersStubs.HEADERS_AND_BODY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._headersAndBodyRequests.push(request);
        }
        throw await response(headersAndBodyResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._singleHeaderRequests.length = 0;
    this._multipleHeadersRequests.length = 0;
    this._requiredHeaderRequests.length = 0;
    this._deprecatedHeaderRequests.length = 0;
    this._refHeaderRequests.length = 0;
    this._headersOnNoContentRequests.length = 0;
    this._headersAndBodyRequests.length = 0;
    super.reset();
  }
}
