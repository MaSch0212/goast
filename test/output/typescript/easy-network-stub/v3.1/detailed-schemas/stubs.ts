import { EasyNetworkStub } from 'easy-network-stub';

import { EasyNetworkStubWrapper } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }

  public resetStubs(): this {
    return this;
  }
}
