import { EasyNetworkStub } from 'easy-network-stub';

import { Service1Stubs } from './stubs/service-1.stubs';
import { EasyNetworkStubWrapper, createEasyNetworkStubGroup } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubGroup, EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';

export { Service1Stubs } from './stubs/service-1.stubs';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;
  private _service1?: EasyNetworkStubGroup<Service1Stubs, this>;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }
  public get service1(): EasyNetworkStubGroup<Service1Stubs, this> {
    return this._service1 ??= createEasyNetworkStubGroup(this, this._stubWrapper, Service1Stubs);
  }

  public resetStubs(): this {
    this._service1?.reset();
    return this;
  }
}
