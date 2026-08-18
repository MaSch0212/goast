import { EasyNetworkStub } from 'easy-network-stub';

import { ParametersStubs } from './stubs/parameters.stubs';
import { EasyNetworkStubWrapper, createEasyNetworkStubGroup } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubGroup, EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';

export { ParametersStubs } from './stubs/parameters.stubs';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;
  private _parameters?: EasyNetworkStubGroup<ParametersStubs, this>;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }
  public get parameters(): EasyNetworkStubGroup<ParametersStubs, this> {
    return this._parameters ??= createEasyNetworkStubGroup(this, this._stubWrapper, ParametersStubs);
  }

  public resetStubs(): this {
    this._parameters?.reset();
    return this;
  }
}
