import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { Pet } from '../models/pet';
import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const getPetResponder = getStubResponder<{
    200: Pet;
    401: never;
    403: never;
    500: never;
  }>();

export class PetsStubs extends EasyNetworkStubBase {
  private static readonly GET_PET_PATH = 'pets/{id:string}' as const;

  private readonly _getPetRequests: (StubRequestInfo<typeof PetsStubs.GET_PET_PATH, unknown>)[] = [];

  public get getPetRequests(): readonly (StubRequestInfo<typeof PetsStubs.GET_PET_PATH, unknown>)[] {
    return this._getPetRequests;
  }

  public stubGetPet(response: StrictRouteResponseCallback<
      unknown,
      typeof PetsStubs.GET_PET_PATH,
      typeof getPetResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      PetsStubs.GET_PET_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._getPetRequests.push(request);
        }
        throw await response(getPetResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._getPetRequests.length = 0;
    super.reset();
  }
}
