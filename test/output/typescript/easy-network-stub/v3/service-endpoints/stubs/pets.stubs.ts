import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { Owner } from '../models/owner';
import type { Pet } from '../models/pet';
import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const listPetsResponder = getStubResponder<{
    200: (Pet)[];
    401: never;
    403: never;
    500: never;
  }>();

const createPetResponder = getStubResponder<{
    201: Pet;
    400: never;
    401: never;
    403: never;
    500: never;
  }>();

const getPetResponder = getStubResponder<{
    200: Pet;
    401: never;
    403: never;
    404: never;
    500: never;
  }>();

const deletePetResponder = getStubResponder<{
    204: never;
    401: never;
    403: never;
    500: never;
  }>();

const searchPetsResponder = getStubResponder<{
    200: Pet;
    202: Owner;
    401: never;
    403: never;
    500: never;
  }>();

export class PetsStubs extends EasyNetworkStubBase {
  private static readonly LIST_PETS_PATH = 'pets' as const;
  private static readonly CREATE_PET_PATH = 'pets' as const;
  private static readonly GET_PET_PATH = 'pets/{id:string}' as const;
  private static readonly DELETE_PET_PATH = 'pets/{id:string}' as const;
  private static readonly SEARCH_PETS_PATH = 'pets/search' as const;

  private readonly _listPetsRequests: (StubRequestInfo<typeof PetsStubs.LIST_PETS_PATH, unknown>)[] = [];
  private readonly _createPetRequests: (StubRequestInfo<typeof PetsStubs.CREATE_PET_PATH, Pet>)[] = [];
  private readonly _getPetRequests: (StubRequestInfo<typeof PetsStubs.GET_PET_PATH, unknown>)[] = [];
  private readonly _deletePetRequests: (StubRequestInfo<typeof PetsStubs.DELETE_PET_PATH, unknown>)[] = [];
  private readonly _searchPetsRequests: (StubRequestInfo<typeof PetsStubs.SEARCH_PETS_PATH, unknown>)[] = [];

  public get listPetsRequests(): readonly (StubRequestInfo<typeof PetsStubs.LIST_PETS_PATH, unknown>)[] {
    return this._listPetsRequests;
  }
  public get createPetRequests(): readonly (StubRequestInfo<typeof PetsStubs.CREATE_PET_PATH, Pet>)[] {
    return this._createPetRequests;
  }
  public get getPetRequests(): readonly (StubRequestInfo<typeof PetsStubs.GET_PET_PATH, unknown>)[] {
    return this._getPetRequests;
  }
  public get deletePetRequests(): readonly (StubRequestInfo<typeof PetsStubs.DELETE_PET_PATH, unknown>)[] {
    return this._deletePetRequests;
  }
  public get searchPetsRequests(): readonly (StubRequestInfo<typeof PetsStubs.SEARCH_PETS_PATH, unknown>)[] {
    return this._searchPetsRequests;
  }

  public stubListPets(response: StrictRouteResponseCallback<
      unknown,
      typeof PetsStubs.LIST_PETS_PATH,
      typeof listPetsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      PetsStubs.LIST_PETS_PATH,
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
      typeof PetsStubs.CREATE_PET_PATH,
      typeof createPetResponder
    >): this {
    this.stubWrapper.stub2<Pet>()(
      'POST',
      PetsStubs.CREATE_PET_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._createPetRequests.push(request);
        }
        throw await response(createPetResponder, request);
      }
    );
    return this;
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

  public stubDeletePet(response: StrictRouteResponseCallback<
      unknown,
      typeof PetsStubs.DELETE_PET_PATH,
      typeof deletePetResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'DELETE',
      PetsStubs.DELETE_PET_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._deletePetRequests.push(request);
        }
        throw await response(deletePetResponder, request);
      }
    );
    return this;
  }

  public stubSearchPets(response: StrictRouteResponseCallback<
      unknown,
      typeof PetsStubs.SEARCH_PETS_PATH,
      typeof searchPetsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      PetsStubs.SEARCH_PETS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._searchPetsRequests.push(request);
        }
        throw await response(searchPetsResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._listPetsRequests.length = 0;
    this._createPetRequests.length = 0;
    this._getPetRequests.length = 0;
    this._deletePetRequests.length = 0;
    this._searchPetsRequests.length = 0;
    super.reset();
  }
}
