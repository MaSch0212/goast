import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const tagWithSpaceResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

export class TagWithSpaceStubs extends EasyNetworkStubBase {
  private static readonly TAG_WITH_SPACE_PATH = 'tag-with-space' as const;

  private readonly _tagWithSpaceRequests: (StubRequestInfo<typeof TagWithSpaceStubs.TAG_WITH_SPACE_PATH, unknown>)[] = [];

  public get tagWithSpaceRequests(): readonly (StubRequestInfo<typeof TagWithSpaceStubs.TAG_WITH_SPACE_PATH, unknown>)[] {
    return this._tagWithSpaceRequests;
  }

  public stubTagWithSpace(response: StrictRouteResponseCallback<
      unknown,
      typeof TagWithSpaceStubs.TAG_WITH_SPACE_PATH,
      typeof tagWithSpaceResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      TagWithSpaceStubs.TAG_WITH_SPACE_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._tagWithSpaceRequests.push(request);
        }
        throw await response(tagWithSpaceResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._tagWithSpaceRequests.length = 0;
    super.reset();
  }
}
