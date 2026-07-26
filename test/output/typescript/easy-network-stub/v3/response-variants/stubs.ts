import { EasyNetworkStub } from 'easy-network-stub';

import { ResponsesStubs } from './stubs/responses.stubs';
import { EasyNetworkStubWrapper, createEasyNetworkStubGroup } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubGroup, EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';

export { ResponsesStubs } from './stubs/responses.stubs';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;
  private _responses?: EasyNetworkStubGroup<ResponsesStubs, this>;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }
  public get responses(): EasyNetworkStubGroup<ResponsesStubs, this> {
    return this._responses ??= createEasyNetworkStubGroup(this, this._stubWrapper, ResponsesStubs);
  }

  public resetStubs(): this {
    this._responses?.reset();
    return this;
  }
}
