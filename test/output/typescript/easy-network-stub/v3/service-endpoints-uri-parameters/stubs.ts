import { EasyNetworkStub } from 'easy-network-stub';

import { ResourcesStubs } from './stubs/resources.stubs';
import { EasyNetworkStubWrapper, createEasyNetworkStubGroup } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubGroup, EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';

export { ResourcesStubs } from './stubs/resources.stubs';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;
  private _resources?: EasyNetworkStubGroup<ResourcesStubs, this>;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }
  public get resources(): EasyNetworkStubGroup<ResourcesStubs, this> {
    return this._resources ??= createEasyNetworkStubGroup(this, this._stubWrapper, ResourcesStubs);
  }

  public resetStubs(): this {
    this._resources?.reset();
    return this;
  }
}
