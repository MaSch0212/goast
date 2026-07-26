import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { Payload } from '../models/payload';
import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const jsonBodyResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const optionalJsonBodyResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const inlineJsonBodyResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const arrayJsonBodyResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const primitiveJsonBodyResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const textBodyResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const binaryBodyResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const anyBodyResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const multiContentBodyResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const formBodyResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const describedBodyResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const refBodyResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

export class BodiesStubs extends EasyNetworkStubBase {
  private static readonly JSON_BODY_PATH = 'json' as const;
  private static readonly OPTIONAL_JSON_BODY_PATH = 'json-optional' as const;
  private static readonly INLINE_JSON_BODY_PATH = 'json-inline' as const;
  private static readonly ARRAY_JSON_BODY_PATH = 'json-array' as const;
  private static readonly PRIMITIVE_JSON_BODY_PATH = 'json-primitive' as const;
  private static readonly TEXT_BODY_PATH = 'text' as const;
  private static readonly BINARY_BODY_PATH = 'binary' as const;
  private static readonly ANY_BODY_PATH = 'any' as const;
  private static readonly MULTI_CONTENT_BODY_PATH = 'multi-content' as const;
  private static readonly FORM_BODY_PATH = 'form' as const;
  private static readonly DESCRIBED_BODY_PATH = 'described-body' as const;
  private static readonly REF_BODY_PATH = 'ref-body' as const;

  private readonly _jsonBodyRequests: (StubRequestInfo<typeof BodiesStubs.JSON_BODY_PATH, Payload>)[] = [];
  private readonly _optionalJsonBodyRequests: (StubRequestInfo<typeof BodiesStubs.OPTIONAL_JSON_BODY_PATH, Payload>)[] = [];
  private readonly _inlineJsonBodyRequests: (StubRequestInfo<typeof BodiesStubs.INLINE_JSON_BODY_PATH, {
        name: string;
        count?: number;
      }>)[] = [];
  private readonly _arrayJsonBodyRequests: (StubRequestInfo<typeof BodiesStubs.ARRAY_JSON_BODY_PATH, (Payload)[]>)[] = [];
  private readonly _primitiveJsonBodyRequests: (StubRequestInfo<typeof BodiesStubs.PRIMITIVE_JSON_BODY_PATH, string>)[] = [];
  private readonly _textBodyRequests: (StubRequestInfo<typeof BodiesStubs.TEXT_BODY_PATH, string>)[] = [];
  private readonly _binaryBodyRequests: (StubRequestInfo<typeof BodiesStubs.BINARY_BODY_PATH, Blob>)[] = [];
  private readonly _anyBodyRequests: (StubRequestInfo<typeof BodiesStubs.ANY_BODY_PATH, unknown>)[] = [];
  private readonly _multiContentBodyRequests: (StubRequestInfo<typeof BodiesStubs.MULTI_CONTENT_BODY_PATH, Payload>)[] = [];
  private readonly _formBodyRequests: (StubRequestInfo<typeof BodiesStubs.FORM_BODY_PATH, {
        username?: string;
        age?: number;
        subscribed?: boolean;
      }>)[] = [];
  private readonly _describedBodyRequests: (StubRequestInfo<typeof BodiesStubs.DESCRIBED_BODY_PATH, Payload>)[] = [];
  private readonly _refBodyRequests: (StubRequestInfo<typeof BodiesStubs.REF_BODY_PATH, Payload>)[] = [];

  public get jsonBodyRequests(): readonly (StubRequestInfo<typeof BodiesStubs.JSON_BODY_PATH, Payload>)[] {
    return this._jsonBodyRequests;
  }
  public get optionalJsonBodyRequests(): readonly (StubRequestInfo<typeof BodiesStubs.OPTIONAL_JSON_BODY_PATH, Payload>)[] {
    return this._optionalJsonBodyRequests;
  }
  public get inlineJsonBodyRequests(): readonly (StubRequestInfo<typeof BodiesStubs.INLINE_JSON_BODY_PATH, {
        name: string;
        count?: number;
      }>)[] {
    return this._inlineJsonBodyRequests;
  }
  public get arrayJsonBodyRequests(): readonly (StubRequestInfo<typeof BodiesStubs.ARRAY_JSON_BODY_PATH, (Payload)[]>)[] {
    return this._arrayJsonBodyRequests;
  }
  public get primitiveJsonBodyRequests(): readonly (StubRequestInfo<typeof BodiesStubs.PRIMITIVE_JSON_BODY_PATH, string>)[] {
    return this._primitiveJsonBodyRequests;
  }
  public get textBodyRequests(): readonly (StubRequestInfo<typeof BodiesStubs.TEXT_BODY_PATH, string>)[] {
    return this._textBodyRequests;
  }
  public get binaryBodyRequests(): readonly (StubRequestInfo<typeof BodiesStubs.BINARY_BODY_PATH, Blob>)[] {
    return this._binaryBodyRequests;
  }
  public get anyBodyRequests(): readonly (StubRequestInfo<typeof BodiesStubs.ANY_BODY_PATH, unknown>)[] {
    return this._anyBodyRequests;
  }
  public get multiContentBodyRequests(): readonly (StubRequestInfo<typeof BodiesStubs.MULTI_CONTENT_BODY_PATH, Payload>)[] {
    return this._multiContentBodyRequests;
  }
  public get formBodyRequests(): readonly (StubRequestInfo<typeof BodiesStubs.FORM_BODY_PATH, {
        username?: string;
        age?: number;
        subscribed?: boolean;
      }>)[] {
    return this._formBodyRequests;
  }
  public get describedBodyRequests(): readonly (StubRequestInfo<typeof BodiesStubs.DESCRIBED_BODY_PATH, Payload>)[] {
    return this._describedBodyRequests;
  }
  public get refBodyRequests(): readonly (StubRequestInfo<typeof BodiesStubs.REF_BODY_PATH, Payload>)[] {
    return this._refBodyRequests;
  }

  public stubJsonBody(response: StrictRouteResponseCallback<
      Payload,
      typeof BodiesStubs.JSON_BODY_PATH,
      typeof jsonBodyResponder
    >): this {
    this.stubWrapper.stub2<Payload>()(
      'POST',
      BodiesStubs.JSON_BODY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._jsonBodyRequests.push(request);
        }
        throw await response(jsonBodyResponder, request);
      }
    );
    return this;
  }

  public stubOptionalJsonBody(response: StrictRouteResponseCallback<
      Payload,
      typeof BodiesStubs.OPTIONAL_JSON_BODY_PATH,
      typeof optionalJsonBodyResponder
    >): this {
    this.stubWrapper.stub2<Payload>()(
      'POST',
      BodiesStubs.OPTIONAL_JSON_BODY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._optionalJsonBodyRequests.push(request);
        }
        throw await response(optionalJsonBodyResponder, request);
      }
    );
    return this;
  }

  public stubInlineJsonBody(response: StrictRouteResponseCallback<
      {
        name: string;
        count?: number;
      },
      typeof BodiesStubs.INLINE_JSON_BODY_PATH,
      typeof inlineJsonBodyResponder
    >): this {
    this.stubWrapper.stub2<{
      name: string;
      count?: number;
    }>()(
      'POST',
      BodiesStubs.INLINE_JSON_BODY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._inlineJsonBodyRequests.push(request);
        }
        throw await response(inlineJsonBodyResponder, request);
      }
    );
    return this;
  }

  public stubArrayJsonBody(response: StrictRouteResponseCallback<
      (Payload)[],
      typeof BodiesStubs.ARRAY_JSON_BODY_PATH,
      typeof arrayJsonBodyResponder
    >): this {
    this.stubWrapper.stub2<(Payload)[]>()(
      'POST',
      BodiesStubs.ARRAY_JSON_BODY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._arrayJsonBodyRequests.push(request);
        }
        throw await response(arrayJsonBodyResponder, request);
      }
    );
    return this;
  }

  public stubPrimitiveJsonBody(response: StrictRouteResponseCallback<
      string,
      typeof BodiesStubs.PRIMITIVE_JSON_BODY_PATH,
      typeof primitiveJsonBodyResponder
    >): this {
    this.stubWrapper.stub2<string>()(
      'POST',
      BodiesStubs.PRIMITIVE_JSON_BODY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._primitiveJsonBodyRequests.push(request);
        }
        throw await response(primitiveJsonBodyResponder, request);
      }
    );
    return this;
  }

  public stubTextBody(response: StrictRouteResponseCallback<
      string,
      typeof BodiesStubs.TEXT_BODY_PATH,
      typeof textBodyResponder
    >): this {
    this.stubWrapper.stub2<string>()(
      'POST',
      BodiesStubs.TEXT_BODY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._textBodyRequests.push(request);
        }
        throw await response(textBodyResponder, request);
      }
    );
    return this;
  }

  public stubBinaryBody(response: StrictRouteResponseCallback<
      Blob,
      typeof BodiesStubs.BINARY_BODY_PATH,
      typeof binaryBodyResponder
    >): this {
    this.stubWrapper.stub2<Blob>()(
      'POST',
      BodiesStubs.BINARY_BODY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._binaryBodyRequests.push(request);
        }
        throw await response(binaryBodyResponder, request);
      }
    );
    return this;
  }

  public stubAnyBody(response: StrictRouteResponseCallback<
      unknown,
      typeof BodiesStubs.ANY_BODY_PATH,
      typeof anyBodyResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'POST',
      BodiesStubs.ANY_BODY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._anyBodyRequests.push(request);
        }
        throw await response(anyBodyResponder, request);
      }
    );
    return this;
  }

  public stubMultiContentBody(response: StrictRouteResponseCallback<
      Payload,
      typeof BodiesStubs.MULTI_CONTENT_BODY_PATH,
      typeof multiContentBodyResponder
    >): this {
    this.stubWrapper.stub2<Payload>()(
      'POST',
      BodiesStubs.MULTI_CONTENT_BODY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._multiContentBodyRequests.push(request);
        }
        throw await response(multiContentBodyResponder, request);
      }
    );
    return this;
  }

  public stubFormBody(response: StrictRouteResponseCallback<
      {
        username?: string;
        age?: number;
        subscribed?: boolean;
      },
      typeof BodiesStubs.FORM_BODY_PATH,
      typeof formBodyResponder
    >): this {
    this.stubWrapper.stub2<{
      username?: string;
      age?: number;
      subscribed?: boolean;
    }>()(
      'POST',
      BodiesStubs.FORM_BODY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._formBodyRequests.push(request);
        }
        throw await response(formBodyResponder, request);
      }
    );
    return this;
  }

  public stubDescribedBody(response: StrictRouteResponseCallback<
      Payload,
      typeof BodiesStubs.DESCRIBED_BODY_PATH,
      typeof describedBodyResponder
    >): this {
    this.stubWrapper.stub2<Payload>()(
      'POST',
      BodiesStubs.DESCRIBED_BODY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._describedBodyRequests.push(request);
        }
        throw await response(describedBodyResponder, request);
      }
    );
    return this;
  }

  public stubRefBody(response: StrictRouteResponseCallback<
      Payload,
      typeof BodiesStubs.REF_BODY_PATH,
      typeof refBodyResponder
    >): this {
    this.stubWrapper.stub2<Payload>()(
      'POST',
      BodiesStubs.REF_BODY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._refBodyRequests.push(request);
        }
        throw await response(refBodyResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._jsonBodyRequests.length = 0;
    this._optionalJsonBodyRequests.length = 0;
    this._inlineJsonBodyRequests.length = 0;
    this._arrayJsonBodyRequests.length = 0;
    this._primitiveJsonBodyRequests.length = 0;
    this._textBodyRequests.length = 0;
    this._binaryBodyRequests.length = 0;
    this._anyBodyRequests.length = 0;
    this._multiContentBodyRequests.length = 0;
    this._formBodyRequests.length = 0;
    this._describedBodyRequests.length = 0;
    this._refBodyRequests.length = 0;
    super.reset();
  }
}
