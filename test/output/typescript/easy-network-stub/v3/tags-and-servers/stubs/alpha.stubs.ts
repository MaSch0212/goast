import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const oneTagResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const twoTagsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const sharedTagResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

export class AlphaStubs extends EasyNetworkStubBase {
  private static readonly ONE_TAG_PATH = 'one-tag' as const;
  private static readonly TWO_TAGS_PATH = 'two-tags' as const;
  private static readonly SHARED_TAG_PATH = 'shared-tag' as const;

  private readonly _oneTagRequests: (StubRequestInfo<typeof AlphaStubs.ONE_TAG_PATH, unknown>)[] = [];
  private readonly _twoTagsRequests: (StubRequestInfo<typeof AlphaStubs.TWO_TAGS_PATH, unknown>)[] = [];
  private readonly _sharedTagRequests: (StubRequestInfo<typeof AlphaStubs.SHARED_TAG_PATH, unknown>)[] = [];

  public get oneTagRequests(): readonly (StubRequestInfo<typeof AlphaStubs.ONE_TAG_PATH, unknown>)[] {
    return this._oneTagRequests;
  }
  public get twoTagsRequests(): readonly (StubRequestInfo<typeof AlphaStubs.TWO_TAGS_PATH, unknown>)[] {
    return this._twoTagsRequests;
  }
  public get sharedTagRequests(): readonly (StubRequestInfo<typeof AlphaStubs.SHARED_TAG_PATH, unknown>)[] {
    return this._sharedTagRequests;
  }

  public stubOneTag(response: StrictRouteResponseCallback<
      unknown,
      typeof AlphaStubs.ONE_TAG_PATH,
      typeof oneTagResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      AlphaStubs.ONE_TAG_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._oneTagRequests.push(request);
        }
        throw await response(oneTagResponder, request);
      }
    );
    return this;
  }

  public stubTwoTags(response: StrictRouteResponseCallback<
      unknown,
      typeof AlphaStubs.TWO_TAGS_PATH,
      typeof twoTagsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      AlphaStubs.TWO_TAGS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._twoTagsRequests.push(request);
        }
        throw await response(twoTagsResponder, request);
      }
    );
    return this;
  }

  public stubSharedTag(response: StrictRouteResponseCallback<
      unknown,
      typeof AlphaStubs.SHARED_TAG_PATH,
      typeof sharedTagResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      AlphaStubs.SHARED_TAG_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._sharedTagRequests.push(request);
        }
        throw await response(sharedTagResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._oneTagRequests.length = 0;
    this._twoTagsRequests.length = 0;
    this._sharedTagRequests.length = 0;
    super.reset();
  }
}
