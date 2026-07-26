import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { Error } from '../models/error';
import type { OtherThing } from '../models/other-thing';
import type { Thing } from '../models/thing';
import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const twoSuccessCodesResponder = getStubResponder<{
    200: Thing;
    201: OtherThing;
    401: never;
    403: never;
    500: never;
  }>();

const successAndDefaultResponder = getStubResponder<{
    200: Thing;
    401: never;
    403: never;
    500: never;
  }>();

const onlyDefaultResponder = getStubResponder<{
    401: never;
    403: never;
    500: never;
  }>();

const noContentResponder = getStubResponder<{
    204: never;
    401: never;
    403: never;
    500: never;
  }>();

const emptyBody200Responder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const rangeCodesResponder = getStubResponder<{
    401: never;
    403: never;
    500: never;
  }>();

const mixedExactAndRangeResponder = getStubResponder<{
    200: Thing;
    401: never;
    403: never;
    500: never;
  }>();

const errorCodesResponder = getStubResponder<{
    200: Thing;
    400: Error;
    401: Error;
    403: never;
    404: Error;
    500: Error;
  }>();

const multiContentResponseResponder = getStubResponder<{
    200: Thing;
    401: never;
    403: never;
    500: never;
  }>();

const primitiveResponseResponder = getStubResponder<{
    200: string;
    401: never;
    403: never;
    500: never;
  }>();

const arrayResponseResponder = getStubResponder<{
    200: (Thing)[];
    401: never;
    403: never;
    500: never;
  }>();

const refResponseResponder = getStubResponder<{
    200: Thing;
    401: never;
    403: never;
    500: never;
  }>();

export class ResponsesStubs extends EasyNetworkStubBase {
  private static readonly TWO_SUCCESS_CODES_PATH = 'two-success' as const;
  private static readonly SUCCESS_AND_DEFAULT_PATH = 'default' as const;
  private static readonly ONLY_DEFAULT_PATH = 'only-default' as const;
  private static readonly NO_CONTENT_PATH = 'no-content' as const;
  private static readonly EMPTY_BODY_200_PATH = 'empty-200' as const;
  private static readonly RANGE_CODES_PATH = 'ranges' as const;
  private static readonly MIXED_EXACT_AND_RANGE_PATH = 'mixed-codes' as const;
  private static readonly ERROR_CODES_PATH = 'errors' as const;
  private static readonly MULTI_CONTENT_RESPONSE_PATH = 'multi-content' as const;
  private static readonly PRIMITIVE_RESPONSE_PATH = 'primitive' as const;
  private static readonly ARRAY_RESPONSE_PATH = 'array' as const;
  private static readonly REF_RESPONSE_PATH = 'ref-response' as const;

  private readonly _twoSuccessCodesRequests: (StubRequestInfo<typeof ResponsesStubs.TWO_SUCCESS_CODES_PATH, unknown>)[] = [];
  private readonly _successAndDefaultRequests: (StubRequestInfo<typeof ResponsesStubs.SUCCESS_AND_DEFAULT_PATH, unknown>)[] = [];
  private readonly _onlyDefaultRequests: (StubRequestInfo<typeof ResponsesStubs.ONLY_DEFAULT_PATH, unknown>)[] = [];
  private readonly _noContentRequests: (StubRequestInfo<typeof ResponsesStubs.NO_CONTENT_PATH, unknown>)[] = [];
  private readonly _emptyBody200Requests: (StubRequestInfo<typeof ResponsesStubs.EMPTY_BODY_200_PATH, unknown>)[] = [];
  private readonly _rangeCodesRequests: (StubRequestInfo<typeof ResponsesStubs.RANGE_CODES_PATH, unknown>)[] = [];
  private readonly _mixedExactAndRangeRequests: (StubRequestInfo<typeof ResponsesStubs.MIXED_EXACT_AND_RANGE_PATH, unknown>)[] = [];
  private readonly _errorCodesRequests: (StubRequestInfo<typeof ResponsesStubs.ERROR_CODES_PATH, unknown>)[] = [];
  private readonly _multiContentResponseRequests: (StubRequestInfo<typeof ResponsesStubs.MULTI_CONTENT_RESPONSE_PATH, unknown>)[] = [];
  private readonly _primitiveResponseRequests: (StubRequestInfo<typeof ResponsesStubs.PRIMITIVE_RESPONSE_PATH, unknown>)[] = [];
  private readonly _arrayResponseRequests: (StubRequestInfo<typeof ResponsesStubs.ARRAY_RESPONSE_PATH, unknown>)[] = [];
  private readonly _refResponseRequests: (StubRequestInfo<typeof ResponsesStubs.REF_RESPONSE_PATH, unknown>)[] = [];

  public get twoSuccessCodesRequests(): readonly (StubRequestInfo<typeof ResponsesStubs.TWO_SUCCESS_CODES_PATH, unknown>)[] {
    return this._twoSuccessCodesRequests;
  }
  public get successAndDefaultRequests(): readonly (StubRequestInfo<typeof ResponsesStubs.SUCCESS_AND_DEFAULT_PATH, unknown>)[] {
    return this._successAndDefaultRequests;
  }
  public get onlyDefaultRequests(): readonly (StubRequestInfo<typeof ResponsesStubs.ONLY_DEFAULT_PATH, unknown>)[] {
    return this._onlyDefaultRequests;
  }
  public get noContentRequests(): readonly (StubRequestInfo<typeof ResponsesStubs.NO_CONTENT_PATH, unknown>)[] {
    return this._noContentRequests;
  }
  public get emptyBody200Requests(): readonly (StubRequestInfo<typeof ResponsesStubs.EMPTY_BODY_200_PATH, unknown>)[] {
    return this._emptyBody200Requests;
  }
  public get rangeCodesRequests(): readonly (StubRequestInfo<typeof ResponsesStubs.RANGE_CODES_PATH, unknown>)[] {
    return this._rangeCodesRequests;
  }
  public get mixedExactAndRangeRequests(): readonly (StubRequestInfo<typeof ResponsesStubs.MIXED_EXACT_AND_RANGE_PATH, unknown>)[] {
    return this._mixedExactAndRangeRequests;
  }
  public get errorCodesRequests(): readonly (StubRequestInfo<typeof ResponsesStubs.ERROR_CODES_PATH, unknown>)[] {
    return this._errorCodesRequests;
  }
  public get multiContentResponseRequests(): readonly (StubRequestInfo<typeof ResponsesStubs.MULTI_CONTENT_RESPONSE_PATH, unknown>)[] {
    return this._multiContentResponseRequests;
  }
  public get primitiveResponseRequests(): readonly (StubRequestInfo<typeof ResponsesStubs.PRIMITIVE_RESPONSE_PATH, unknown>)[] {
    return this._primitiveResponseRequests;
  }
  public get arrayResponseRequests(): readonly (StubRequestInfo<typeof ResponsesStubs.ARRAY_RESPONSE_PATH, unknown>)[] {
    return this._arrayResponseRequests;
  }
  public get refResponseRequests(): readonly (StubRequestInfo<typeof ResponsesStubs.REF_RESPONSE_PATH, unknown>)[] {
    return this._refResponseRequests;
  }

  public stubTwoSuccessCodes(response: StrictRouteResponseCallback<
      unknown,
      typeof ResponsesStubs.TWO_SUCCESS_CODES_PATH,
      typeof twoSuccessCodesResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ResponsesStubs.TWO_SUCCESS_CODES_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._twoSuccessCodesRequests.push(request);
        }
        throw await response(twoSuccessCodesResponder, request);
      }
    );
    return this;
  }

  public stubSuccessAndDefault(response: StrictRouteResponseCallback<
      unknown,
      typeof ResponsesStubs.SUCCESS_AND_DEFAULT_PATH,
      typeof successAndDefaultResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ResponsesStubs.SUCCESS_AND_DEFAULT_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._successAndDefaultRequests.push(request);
        }
        throw await response(successAndDefaultResponder, request);
      }
    );
    return this;
  }

  public stubOnlyDefault(response: StrictRouteResponseCallback<
      unknown,
      typeof ResponsesStubs.ONLY_DEFAULT_PATH,
      typeof onlyDefaultResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ResponsesStubs.ONLY_DEFAULT_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._onlyDefaultRequests.push(request);
        }
        throw await response(onlyDefaultResponder, request);
      }
    );
    return this;
  }

  public stubNoContent(response: StrictRouteResponseCallback<
      unknown,
      typeof ResponsesStubs.NO_CONTENT_PATH,
      typeof noContentResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ResponsesStubs.NO_CONTENT_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._noContentRequests.push(request);
        }
        throw await response(noContentResponder, request);
      }
    );
    return this;
  }

  public stubEmptyBody200(response: StrictRouteResponseCallback<
      unknown,
      typeof ResponsesStubs.EMPTY_BODY_200_PATH,
      typeof emptyBody200Responder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ResponsesStubs.EMPTY_BODY_200_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._emptyBody200Requests.push(request);
        }
        throw await response(emptyBody200Responder, request);
      }
    );
    return this;
  }

  public stubRangeCodes(response: StrictRouteResponseCallback<
      unknown,
      typeof ResponsesStubs.RANGE_CODES_PATH,
      typeof rangeCodesResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ResponsesStubs.RANGE_CODES_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._rangeCodesRequests.push(request);
        }
        throw await response(rangeCodesResponder, request);
      }
    );
    return this;
  }

  public stubMixedExactAndRange(response: StrictRouteResponseCallback<
      unknown,
      typeof ResponsesStubs.MIXED_EXACT_AND_RANGE_PATH,
      typeof mixedExactAndRangeResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ResponsesStubs.MIXED_EXACT_AND_RANGE_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._mixedExactAndRangeRequests.push(request);
        }
        throw await response(mixedExactAndRangeResponder, request);
      }
    );
    return this;
  }

  public stubErrorCodes(response: StrictRouteResponseCallback<
      unknown,
      typeof ResponsesStubs.ERROR_CODES_PATH,
      typeof errorCodesResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ResponsesStubs.ERROR_CODES_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._errorCodesRequests.push(request);
        }
        throw await response(errorCodesResponder, request);
      }
    );
    return this;
  }

  public stubMultiContentResponse(response: StrictRouteResponseCallback<
      unknown,
      typeof ResponsesStubs.MULTI_CONTENT_RESPONSE_PATH,
      typeof multiContentResponseResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ResponsesStubs.MULTI_CONTENT_RESPONSE_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._multiContentResponseRequests.push(request);
        }
        throw await response(multiContentResponseResponder, request);
      }
    );
    return this;
  }

  public stubPrimitiveResponse(response: StrictRouteResponseCallback<
      unknown,
      typeof ResponsesStubs.PRIMITIVE_RESPONSE_PATH,
      typeof primitiveResponseResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ResponsesStubs.PRIMITIVE_RESPONSE_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._primitiveResponseRequests.push(request);
        }
        throw await response(primitiveResponseResponder, request);
      }
    );
    return this;
  }

  public stubArrayResponse(response: StrictRouteResponseCallback<
      unknown,
      typeof ResponsesStubs.ARRAY_RESPONSE_PATH,
      typeof arrayResponseResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ResponsesStubs.ARRAY_RESPONSE_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._arrayResponseRequests.push(request);
        }
        throw await response(arrayResponseResponder, request);
      }
    );
    return this;
  }

  public stubRefResponse(response: StrictRouteResponseCallback<
      unknown,
      typeof ResponsesStubs.REF_RESPONSE_PATH,
      typeof refResponseResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ResponsesStubs.REF_RESPONSE_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._refResponseRequests.push(request);
        }
        throw await response(refResponseResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._twoSuccessCodesRequests.length = 0;
    this._successAndDefaultRequests.length = 0;
    this._onlyDefaultRequests.length = 0;
    this._noContentRequests.length = 0;
    this._emptyBody200Requests.length = 0;
    this._rangeCodesRequests.length = 0;
    this._mixedExactAndRangeRequests.length = 0;
    this._errorCodesRequests.length = 0;
    this._multiContentResponseRequests.length = 0;
    this._primitiveResponseRequests.length = 0;
    this._arrayResponseRequests.length = 0;
    this._refResponseRequests.length = 0;
    super.reset();
  }
}
