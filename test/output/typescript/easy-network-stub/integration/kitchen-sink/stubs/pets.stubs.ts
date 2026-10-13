import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { PetUpdate } from '../models/pet-update';
import type { Pet } from '../models/pet';
import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const getPetResponder = getStubResponder<{
    200: Pet;
    401: never;
    403: never;
    500: never;
  }>();

const updatePetResponder = getStubResponder<{
    200: Pet;
    401: never;
    403: never;
    500: never;
  }>();

const deletePetResponder = getStubResponder<{
    204: never;
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

const uploadPetPhotoResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const addPetNoteResponder = getStubResponder<{
    200: Pet;
    401: never;
    403: never;
    500: never;
  }>();

export class PetsStubs extends EasyNetworkStubBase {
  private static readonly GET_PET_PATH = 'pets/{id:string}' as const;
  private static readonly UPDATE_PET_PATH = 'pets/{id:string}' as const;
  private static readonly DELETE_PET_PATH = 'pets/{id:string}' as const;
  private static readonly CREATE_PET_PATH = 'pets' as const;
  private static readonly UPLOAD_PET_PHOTO_PATH = 'pets/{id:string}/photo' as const;
  private static readonly ADD_PET_NOTE_PATH = 'pets/{id:string}/note' as const;

  private readonly _getPetRequests: (StubRequestInfo<typeof PetsStubs.GET_PET_PATH, unknown>)[] = [];
  private readonly _updatePetRequests: (StubRequestInfo<typeof PetsStubs.UPDATE_PET_PATH, PetUpdate>)[] = [];
  private readonly _deletePetRequests: (StubRequestInfo<typeof PetsStubs.DELETE_PET_PATH, unknown>)[] = [];
  private readonly _createPetRequests: (StubRequestInfo<typeof PetsStubs.CREATE_PET_PATH, Pet>)[] = [];
  private readonly _uploadPetPhotoRequests: (StubRequestInfo<typeof PetsStubs.UPLOAD_PET_PHOTO_PATH, {
        file: Blob;
        caption?: string;
      }>)[] = [];
  private readonly _addPetNoteRequests: (StubRequestInfo<typeof PetsStubs.ADD_PET_NOTE_PATH, string>)[] = [];

  public get getPetRequests(): readonly (StubRequestInfo<typeof PetsStubs.GET_PET_PATH, unknown>)[] {
    return this._getPetRequests;
  }
  public get updatePetRequests(): readonly (StubRequestInfo<typeof PetsStubs.UPDATE_PET_PATH, PetUpdate>)[] {
    return this._updatePetRequests;
  }
  public get deletePetRequests(): readonly (StubRequestInfo<typeof PetsStubs.DELETE_PET_PATH, unknown>)[] {
    return this._deletePetRequests;
  }
  public get createPetRequests(): readonly (StubRequestInfo<typeof PetsStubs.CREATE_PET_PATH, Pet>)[] {
    return this._createPetRequests;
  }
  public get uploadPetPhotoRequests(): readonly (StubRequestInfo<typeof PetsStubs.UPLOAD_PET_PHOTO_PATH, {
        file: Blob;
        caption?: string;
      }>)[] {
    return this._uploadPetPhotoRequests;
  }
  public get addPetNoteRequests(): readonly (StubRequestInfo<typeof PetsStubs.ADD_PET_NOTE_PATH, string>)[] {
    return this._addPetNoteRequests;
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

  public stubUpdatePet(response: StrictRouteResponseCallback<
      PetUpdate,
      typeof PetsStubs.UPDATE_PET_PATH,
      typeof updatePetResponder
    >): this {
    this.stubWrapper.stub2<PetUpdate>()(
      'PUT',
      PetsStubs.UPDATE_PET_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._updatePetRequests.push(request);
        }
        throw await response(updatePetResponder, request);
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

  public stubUploadPetPhoto(response: StrictRouteResponseCallback<
      {
        file: Blob;
        caption?: string;
      },
      typeof PetsStubs.UPLOAD_PET_PHOTO_PATH,
      typeof uploadPetPhotoResponder
    >): this {
    this.stubWrapper.stub2<{
      file: Blob;
      caption?: string;
    }>()(
      'POST',
      PetsStubs.UPLOAD_PET_PHOTO_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._uploadPetPhotoRequests.push(request);
        }
        throw await response(uploadPetPhotoResponder, request);
      }
    );
    return this;
  }

  public stubAddPetNote(response: StrictRouteResponseCallback<
      string,
      typeof PetsStubs.ADD_PET_NOTE_PATH,
      typeof addPetNoteResponder
    >): this {
    this.stubWrapper.stub2<string>()(
      'POST',
      PetsStubs.ADD_PET_NOTE_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._addPetNoteRequests.push(request);
        }
        throw await response(addPetNoteResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._getPetRequests.length = 0;
    this._updatePetRequests.length = 0;
    this._deletePetRequests.length = 0;
    this._createPetRequests.length = 0;
    this._uploadPetPhotoRequests.length = 0;
    this._addPetNoteRequests.length = 0;
    super.reset();
  }
}
