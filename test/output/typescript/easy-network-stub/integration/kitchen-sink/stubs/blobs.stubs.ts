import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { BlobRef } from '../models/blob-ref';
import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const uploadBlobResponder = getStubResponder<{
    201: BlobRef;
    401: never;
    403: never;
    500: never;
  }>();

export class BlobsStubs extends EasyNetworkStubBase {
  private static readonly UPLOAD_BLOB_PATH = 'blobs' as const;

  private readonly _uploadBlobRequests: (StubRequestInfo<typeof BlobsStubs.UPLOAD_BLOB_PATH, Blob>)[] = [];

  public get uploadBlobRequests(): readonly (StubRequestInfo<typeof BlobsStubs.UPLOAD_BLOB_PATH, Blob>)[] {
    return this._uploadBlobRequests;
  }

  public stubUploadBlob(response: StrictRouteResponseCallback<
      Blob,
      typeof BlobsStubs.UPLOAD_BLOB_PATH,
      typeof uploadBlobResponder
    >): this {
    this.stubWrapper.stub2<Blob>()(
      'POST',
      BlobsStubs.UPLOAD_BLOB_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._uploadBlobRequests.push(request);
        }
        throw await response(uploadBlobResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._uploadBlobRequests.length = 0;
    super.reset();
  }
}
