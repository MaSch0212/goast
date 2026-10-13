import { EasyNetworkStub } from 'easy-network-stub';

import { DeprecationStubs } from './stubs/deprecation.stubs';
import { EasyNetworkStubWrapper, createEasyNetworkStubGroup } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubGroup, EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';

export { DeprecationStubs } from './stubs/deprecation.stubs';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;
  private _deprecation?: EasyNetworkStubGroup<DeprecationStubs, this>;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }
  public get deprecation(): EasyNetworkStubGroup<DeprecationStubs, this> {
    return this._deprecation ??= createEasyNetworkStubGroup(this, this._stubWrapper, DeprecationStubs);
  }

  public resetStubs(): this {
    this._deprecation?.reset();
    return this;
  }
}
