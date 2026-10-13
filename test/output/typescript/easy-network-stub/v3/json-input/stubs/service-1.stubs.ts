import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { Thing } from '../models/thing';
import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const listThingsResponder = getStubResponder<{
    200: (Thing)[];
    401: never;
    403: never;
    500: never;
  }>();

export class Service1Stubs extends EasyNetworkStubBase {
  private static readonly LIST_THINGS_PATH = 'things' as const;

  private readonly _listThingsRequests: (StubRequestInfo<typeof Service1Stubs.LIST_THINGS_PATH, unknown>)[] = [];

  public get listThingsRequests(): readonly (StubRequestInfo<typeof Service1Stubs.LIST_THINGS_PATH, unknown>)[] {
    return this._listThingsRequests;
  }

  public stubListThings(response: StrictRouteResponseCallback<
      unknown,
      typeof Service1Stubs.LIST_THINGS_PATH,
      typeof listThingsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      Service1Stubs.LIST_THINGS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._listThingsRequests.push(request);
        }
        throw await response(listThingsResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._listThingsRequests.length = 0;
    super.reset();
  }
}
