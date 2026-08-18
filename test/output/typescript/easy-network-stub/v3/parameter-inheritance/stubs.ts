import { EasyNetworkStub } from 'easy-network-stub';

import { InheritanceStubs } from './stubs/inheritance.stubs';
import { EasyNetworkStubWrapper, createEasyNetworkStubGroup } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubGroup, EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';

export { InheritanceStubs } from './stubs/inheritance.stubs';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;
  private _inheritance?: EasyNetworkStubGroup<InheritanceStubs, this>;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }
  public get inheritance(): EasyNetworkStubGroup<InheritanceStubs, this> {
    return this._inheritance ??= createEasyNetworkStubGroup(this, this._stubWrapper, InheritanceStubs);
  }

  public resetStubs(): this {
    this._inheritance?.reset();
    return this;
  }
}
