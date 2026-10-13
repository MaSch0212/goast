import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { Payload } from '../models/payload';
import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const singleFileResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const multipleFilesResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const fileAndFieldsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const nestedObjectPartResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const refPartResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const withEncodingResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const optionalFileResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

export class MultipartStubs extends EasyNetworkStubBase {
  private static readonly SINGLE_FILE_PATH = 'file' as const;
  private static readonly MULTIPLE_FILES_PATH = 'files' as const;
  private static readonly FILE_AND_FIELDS_PATH = 'mixed' as const;
  private static readonly NESTED_OBJECT_PART_PATH = 'nested' as const;
  private static readonly REF_PART_PATH = 'ref-part' as const;
  private static readonly WITH_ENCODING_PATH = 'encoded' as const;
  private static readonly OPTIONAL_FILE_PATH = 'optional-file' as const;

  private readonly _singleFileRequests: (StubRequestInfo<typeof MultipartStubs.SINGLE_FILE_PATH, {
        file: Blob;
      }>)[] = [];
  private readonly _multipleFilesRequests: (StubRequestInfo<typeof MultipartStubs.MULTIPLE_FILES_PATH, {
        files?: (Blob)[];
      }>)[] = [];
  private readonly _fileAndFieldsRequests: (StubRequestInfo<typeof MultipartStubs.FILE_AND_FIELDS_PATH, {
        file?: Blob;
        label?: string;
        quantity?: number;
        active?: boolean;
      }>)[] = [];
  private readonly _nestedObjectPartRequests: (StubRequestInfo<typeof MultipartStubs.NESTED_OBJECT_PART_PATH, {
        metadata?: {
          author?: string;
          version?: number;
        };
      }>)[] = [];
  private readonly _refPartRequests: (StubRequestInfo<typeof MultipartStubs.REF_PART_PATH, {
        payload?: Payload;
      }>)[] = [];
  private readonly _withEncodingRequests: (StubRequestInfo<typeof MultipartStubs.WITH_ENCODING_PATH, {
        file?: Blob;
        label?: string;
        quantity?: number;
        active?: boolean;
      }>)[] = [];
  private readonly _optionalFileRequests: (StubRequestInfo<typeof MultipartStubs.OPTIONAL_FILE_PATH, {
        file?: Blob;
      }>)[] = [];

  public get singleFileRequests(): readonly (StubRequestInfo<typeof MultipartStubs.SINGLE_FILE_PATH, {
        file: Blob;
      }>)[] {
    return this._singleFileRequests;
  }
  public get multipleFilesRequests(): readonly (StubRequestInfo<typeof MultipartStubs.MULTIPLE_FILES_PATH, {
        files?: (Blob)[];
      }>)[] {
    return this._multipleFilesRequests;
  }
  public get fileAndFieldsRequests(): readonly (StubRequestInfo<typeof MultipartStubs.FILE_AND_FIELDS_PATH, {
        file?: Blob;
        label?: string;
        quantity?: number;
        active?: boolean;
      }>)[] {
    return this._fileAndFieldsRequests;
  }
  public get nestedObjectPartRequests(): readonly (StubRequestInfo<typeof MultipartStubs.NESTED_OBJECT_PART_PATH, {
        metadata?: {
          author?: string;
          version?: number;
        };
      }>)[] {
    return this._nestedObjectPartRequests;
  }
  public get refPartRequests(): readonly (StubRequestInfo<typeof MultipartStubs.REF_PART_PATH, {
        payload?: Payload;
      }>)[] {
    return this._refPartRequests;
  }
  public get withEncodingRequests(): readonly (StubRequestInfo<typeof MultipartStubs.WITH_ENCODING_PATH, {
        file?: Blob;
        label?: string;
        quantity?: number;
        active?: boolean;
      }>)[] {
    return this._withEncodingRequests;
  }
  public get optionalFileRequests(): readonly (StubRequestInfo<typeof MultipartStubs.OPTIONAL_FILE_PATH, {
        file?: Blob;
      }>)[] {
    return this._optionalFileRequests;
  }

  public stubSingleFile(response: StrictRouteResponseCallback<
      {
        file: Blob;
      },
      typeof MultipartStubs.SINGLE_FILE_PATH,
      typeof singleFileResponder
    >): this {
    this.stubWrapper.stub2<{
      file: Blob;
    }>()(
      'POST',
      MultipartStubs.SINGLE_FILE_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._singleFileRequests.push(request);
        }
        throw await response(singleFileResponder, request);
      }
    );
    return this;
  }

  public stubMultipleFiles(response: StrictRouteResponseCallback<
      {
        files?: (Blob)[];
      },
      typeof MultipartStubs.MULTIPLE_FILES_PATH,
      typeof multipleFilesResponder
    >): this {
    this.stubWrapper.stub2<{
      files?: (Blob)[];
    }>()(
      'POST',
      MultipartStubs.MULTIPLE_FILES_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._multipleFilesRequests.push(request);
        }
        throw await response(multipleFilesResponder, request);
      }
    );
    return this;
  }

  public stubFileAndFields(response: StrictRouteResponseCallback<
      {
        file?: Blob;
        label?: string;
        quantity?: number;
        active?: boolean;
      },
      typeof MultipartStubs.FILE_AND_FIELDS_PATH,
      typeof fileAndFieldsResponder
    >): this {
    this.stubWrapper.stub2<{
      file?: Blob;
      label?: string;
      quantity?: number;
      active?: boolean;
    }>()(
      'POST',
      MultipartStubs.FILE_AND_FIELDS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._fileAndFieldsRequests.push(request);
        }
        throw await response(fileAndFieldsResponder, request);
      }
    );
    return this;
  }

  public stubNestedObjectPart(response: StrictRouteResponseCallback<
      {
        metadata?: {
          author?: string;
          version?: number;
        };
      },
      typeof MultipartStubs.NESTED_OBJECT_PART_PATH,
      typeof nestedObjectPartResponder
    >): this {
    this.stubWrapper.stub2<{
      metadata?: {
        author?: string;
        version?: number;
      };
    }>()(
      'POST',
      MultipartStubs.NESTED_OBJECT_PART_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._nestedObjectPartRequests.push(request);
        }
        throw await response(nestedObjectPartResponder, request);
      }
    );
    return this;
  }

  public stubRefPart(response: StrictRouteResponseCallback<
      {
        payload?: Payload;
      },
      typeof MultipartStubs.REF_PART_PATH,
      typeof refPartResponder
    >): this {
    this.stubWrapper.stub2<{
      payload?: Payload;
    }>()(
      'POST',
      MultipartStubs.REF_PART_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._refPartRequests.push(request);
        }
        throw await response(refPartResponder, request);
      }
    );
    return this;
  }

  public stubWithEncoding(response: StrictRouteResponseCallback<
      {
        file?: Blob;
        label?: string;
        quantity?: number;
        active?: boolean;
      },
      typeof MultipartStubs.WITH_ENCODING_PATH,
      typeof withEncodingResponder
    >): this {
    this.stubWrapper.stub2<{
      file?: Blob;
      label?: string;
      quantity?: number;
      active?: boolean;
    }>()(
      'POST',
      MultipartStubs.WITH_ENCODING_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._withEncodingRequests.push(request);
        }
        throw await response(withEncodingResponder, request);
      }
    );
    return this;
  }

  public stubOptionalFile(response: StrictRouteResponseCallback<
      {
        file?: Blob;
      },
      typeof MultipartStubs.OPTIONAL_FILE_PATH,
      typeof optionalFileResponder
    >): this {
    this.stubWrapper.stub2<{
      file?: Blob;
    }>()(
      'POST',
      MultipartStubs.OPTIONAL_FILE_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._optionalFileRequests.push(request);
        }
        throw await response(optionalFileResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._singleFileRequests.length = 0;
    this._multipleFilesRequests.length = 0;
    this._fileAndFieldsRequests.length = 0;
    this._nestedObjectPartRequests.length = 0;
    this._refPartRequests.length = 0;
    this._withEncodingRequests.length = 0;
    this._optionalFileRequests.length = 0;
    super.reset();
  }
}
