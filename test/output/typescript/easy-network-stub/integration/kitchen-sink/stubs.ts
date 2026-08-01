import { EasyNetworkStub } from 'easy-network-stub';

import { PetsStubs } from './stubs/pets.stubs';
import { EasyNetworkStubWrapper, createEasyNetworkStubGroup } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubGroup, EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';

export { PetsStubs } from './stubs/pets.stubs';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;
  private _pets?: EasyNetworkStubGroup<PetsStubs, this>;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }
  public get pets(): EasyNetworkStubGroup<PetsStubs, this> {
    return this._pets ??= createEasyNetworkStubGroup(this, this._stubWrapper, PetsStubs);
  }

  public resetStubs(): this {
    this._pets?.reset();
    return this;
  }
}
