import { EasyNetworkStub } from 'easy-network-stub';

import { BlobsStubs } from './stubs/blobs.stubs';
import { ParamsStubs } from './stubs/params.stubs';
import { PetsStubs } from './stubs/pets.stubs';
import { WidgetsStubs } from './stubs/widgets.stubs';
import { EasyNetworkStubWrapper, createEasyNetworkStubGroup } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubGroup, EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';

export { BlobsStubs } from './stubs/blobs.stubs';
export { ParamsStubs } from './stubs/params.stubs';
export { PetsStubs } from './stubs/pets.stubs';
export { WidgetsStubs } from './stubs/widgets.stubs';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;
  private _pets?: EasyNetworkStubGroup<PetsStubs, this>;
  private _widgets?: EasyNetworkStubGroup<WidgetsStubs, this>;
  private _blobs?: EasyNetworkStubGroup<BlobsStubs, this>;
  private _params?: EasyNetworkStubGroup<ParamsStubs, this>;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }
  public get pets(): EasyNetworkStubGroup<PetsStubs, this> {
    return this._pets ??= createEasyNetworkStubGroup(this, this._stubWrapper, PetsStubs);
  }
  public get widgets(): EasyNetworkStubGroup<WidgetsStubs, this> {
    return this._widgets ??= createEasyNetworkStubGroup(this, this._stubWrapper, WidgetsStubs);
  }
  public get blobs(): EasyNetworkStubGroup<BlobsStubs, this> {
    return this._blobs ??= createEasyNetworkStubGroup(this, this._stubWrapper, BlobsStubs);
  }
  public get params(): EasyNetworkStubGroup<ParamsStubs, this> {
    return this._params ??= createEasyNetworkStubGroup(this, this._stubWrapper, ParamsStubs);
  }

  public resetStubs(): this {
    this._pets?.reset();
    this._widgets?.reset();
    this._blobs?.reset();
    this._params?.reset();
    return this;
  }
}
