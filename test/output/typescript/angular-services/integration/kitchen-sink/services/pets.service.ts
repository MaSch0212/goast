import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { waitForResponse } from '../utils/angular-service.utils';
import { ApiBaseService } from '../utils/api-base-service';
import { RequestBuilder } from '../utils/request-builder';

import type { PetUpdate } from '../models/pet-update';
import type { Pet } from '../models/pet';
import type { AddPetNoteApiResponse, CreatePetApiResponse, DeletePetApiResponse, GetPetApiResponse, UpdatePetApiResponse, UploadPetPhotoApiResponse } from '../models/responses/pets-responses.model';
import type { AbortablePromise } from '../utils/angular-service.utils';

/**
 * Parameters for operation getPet
 */
type GetPetParams = {
    id: string;
  };

/**
 * Parameters for operation updatePet
 */
type UpdatePetParams = {
    id: string;
    body: PetUpdate;
  };

/**
 * Parameters for operation deletePet
 */
type DeletePetParams = {
    id: string;
  };

/**
 * Parameters for operation createPet
 */
type CreatePetParams = {
    body: Pet;
  };

/**
 * Parameters for operation uploadPetPhoto
 */
type UploadPetPhotoParams = {
    id: string;
    body: {
      file: Blob;
      caption?: string;
    };
  };

/**
 * Parameters for operation addPetNote
 */
type AddPetNoteParams = {
    id: string;
    body: string;
  };

@Injectable()
export class PetsService extends ApiBaseService {
  private static readonly GET_PET_PATH = '/pets/{id}';
  private static readonly UPDATE_PET_PATH = '/pets/{id}';
  private static readonly DELETE_PET_PATH = '/pets/{id}';
  private static readonly CREATE_PET_PATH = '/pets';
  private static readonly UPLOAD_PET_PHOTO_PATH = '/pets/{id}/photo';
  private static readonly ADD_PET_NOTE_PATH = '/pets/{id}/note';

  public getPet(params: GetPetParams, context?: HttpContext): AbortablePromise<GetPetApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PetsService.GET_PET_PATH, 'get');
    rb.path('id', params.id, {});

    return waitForResponse<GetPetApiResponse>(
      this.http.request(rb.build({
        responseType: 'json',
        accept: 'application/json',
        context,
      })),
      {
        errorResponseTypes: {
          401: 'text',
          403: 'text',
          500: 'text',
        }
      }
    )
  }

  public updatePet(params: UpdatePetParams, context?: HttpContext): AbortablePromise<UpdatePetApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PetsService.UPDATE_PET_PATH, 'put');
    rb.path('id', params.id, {});
    rb.body(params.body, 'application/json');

    return waitForResponse<UpdatePetApiResponse>(
      this.http.request(rb.build({
        responseType: 'json',
        accept: 'application/json',
        context,
      })),
      {
        errorResponseTypes: {
          401: 'text',
          403: 'text',
          500: 'text',
        }
      }
    )
  }

  public deletePet(params: DeletePetParams, context?: HttpContext): AbortablePromise<DeletePetApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PetsService.DELETE_PET_PATH, 'delete');
    rb.path('id', params.id, {});

    return waitForResponse<DeletePetApiResponse>(
      this.http.request(rb.build({
        responseType: 'text',
        accept: '*/*',
        context,
      })),
      {
        errorResponseTypes: {
          401: 'text',
          403: 'text',
          500: 'text',
        }
      }
    )
  }

  public createPet(params: CreatePetParams, context?: HttpContext): AbortablePromise<CreatePetApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PetsService.CREATE_PET_PATH, 'post');
    rb.body(params.body, 'application/json');

    return waitForResponse<CreatePetApiResponse>(
      this.http.request(rb.build({
        responseType: 'json',
        accept: 'application/json',
        context,
      })),
      {
        errorResponseTypes: {
          401: 'text',
          403: 'text',
          500: 'text',
        }
      }
    )
  }

  public uploadPetPhoto(params: UploadPetPhotoParams, context?: HttpContext): AbortablePromise<UploadPetPhotoApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PetsService.UPLOAD_PET_PHOTO_PATH, 'post');
    rb.path('id', params.id, {});
    rb.body(params.body, 'multipart/form-data');

    return waitForResponse<UploadPetPhotoApiResponse>(
      this.http.request(rb.build({
        responseType: 'text',
        accept: '*/*',
        context,
      })),
      {
        errorResponseTypes: {
          401: 'text',
          403: 'text',
          500: 'text',
        }
      }
    )
  }

  public addPetNote(params: AddPetNoteParams, context?: HttpContext): AbortablePromise<AddPetNoteApiResponse> {
    const rb = new RequestBuilder(this.rootUrl, PetsService.ADD_PET_NOTE_PATH, 'post');
    rb.path('id', params.id, {});
    rb.body(params.body, 'text/plain');

    return waitForResponse<AddPetNoteApiResponse>(
      this.http.request(rb.build({
        responseType: 'json',
        accept: 'application/json',
        context,
      })),
      {
        errorResponseTypes: {
          401: 'text',
          403: 'text',
          500: 'text',
        }
      }
    )
  }
}
