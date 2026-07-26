import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { Owner } from '../models/owner';
import type { Pet } from '../models/pet';
import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const getOwnerResponder = getStubResponder<{
    200: Owner;
    401: never;
    403: never;
    500: never;
  }>();

const listPetsResponder = getStubResponder<{
    200: (Pet)[];
    401: never;
    403: never;
    500: never;
  }>();

const createPetResponder = getStubResponder<{
    201: Pet;
    401: never;
    403: never;
    500: never;
  }>();

export class Service1Stubs extends EasyNetworkStubBase {
  private static readonly GET_OWNER_PATH = 'owners/{id:string}' as const;
  private static readonly LIST_PETS_PATH = 'pets' as const;
  private static readonly CREATE_PET_PATH = 'pets' as const;

  private readonly _getOwnerRequests: (StubRequestInfo<typeof Service1Stubs.GET_OWNER_PATH, unknown>)[] = [];
  private readonly _listPetsRequests: (StubRequestInfo<typeof Service1Stubs.LIST_PETS_PATH, unknown>)[] = [];
  private readonly _createPetRequests: (StubRequestInfo<typeof Service1Stubs.CREATE_PET_PATH, Pet>)[] = [];

  public get getOwnerRequests(): readonly (StubRequestInfo<typeof Service1Stubs.GET_OWNER_PATH, unknown>)[] {
    return this._getOwnerRequests;
  }
  public get listPetsRequests(): readonly (StubRequestInfo<typeof Service1Stubs.LIST_PETS_PATH, unknown>)[] {
    return this._listPetsRequests;
  }
  public get createPetRequests(): readonly (StubRequestInfo<typeof Service1Stubs.CREATE_PET_PATH, Pet>)[] {
    return this._createPetRequests;
  }

  public stubGetOwner(response: StrictRouteResponseCallback<
      unknown,
      typeof Service1Stubs.GET_OWNER_PATH,
      typeof getOwnerResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      Service1Stubs.GET_OWNER_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._getOwnerRequests.push(request);
        }
        throw await response(getOwnerResponder, request);
      }
    );
    return this;
  }

  public stubListPets(response: StrictRouteResponseCallback<
      unknown,
      typeof Service1Stubs.LIST_PETS_PATH,
      typeof listPetsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      Service1Stubs.LIST_PETS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._listPetsRequests.push(request);
        }
        throw await response(listPetsResponder, request);
      }
    );
    return this;
  }

  public stubCreatePet(response: StrictRouteResponseCallback<
      Pet,
      typeof Service1Stubs.CREATE_PET_PATH,
      typeof createPetResponder
    >): this {
    this.stubWrapper.stub2<Pet>()(
      'POST',
      Service1Stubs.CREATE_PET_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._createPetRequests.push(request);
        }
        throw await response(createPetResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._getOwnerRequests.length = 0;
    this._listPetsRequests.length = 0;
    this._createPetRequests.length = 0;
    super.reset();
  }
}
