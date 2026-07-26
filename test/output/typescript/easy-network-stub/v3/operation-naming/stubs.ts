import { EasyNetworkStub } from 'easy-network-stub';

import { NamingStubs } from './stubs/naming.stubs';
import { EasyNetworkStubWrapper, createEasyNetworkStubGroup } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubGroup, EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';

export { NamingStubs } from './stubs/naming.stubs';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;
  private _naming?: EasyNetworkStubGroup<NamingStubs, this>;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }
  public get naming(): EasyNetworkStubGroup<NamingStubs, this> {
    return this._naming ??= createEasyNetworkStubGroup(this, this._stubWrapper, NamingStubs);
  }

  public resetStubs(): this {
    this._naming?.reset();
    return this;
  }
}
