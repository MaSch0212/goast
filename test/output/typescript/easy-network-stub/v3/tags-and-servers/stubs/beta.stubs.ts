import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const twoTagsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

export class BetaStubs extends EasyNetworkStubBase {
  private static readonly TWO_TAGS_PATH = 'two-tags' as const;

  private readonly _twoTagsRequests: (StubRequestInfo<typeof BetaStubs.TWO_TAGS_PATH, unknown>)[] = [];

  public get twoTagsRequests(): readonly (StubRequestInfo<typeof BetaStubs.TWO_TAGS_PATH, unknown>)[] {
    return this._twoTagsRequests;
  }

  public stubTwoTags(response: StrictRouteResponseCallback<
      unknown,
      typeof BetaStubs.TWO_TAGS_PATH,
      typeof twoTagsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      BetaStubs.TWO_TAGS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._twoTagsRequests.push(request);
        }
        throw await response(twoTagsResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._twoTagsRequests.length = 0;
    super.reset();
  }
}
