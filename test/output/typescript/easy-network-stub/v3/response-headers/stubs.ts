import { EasyNetworkStub } from 'easy-network-stub';

import { HeadersStubs } from './stubs/headers.stubs';
import { EasyNetworkStubWrapper, createEasyNetworkStubGroup } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubGroup, EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';

export { HeadersStubs } from './stubs/headers.stubs';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;
  private _headers?: EasyNetworkStubGroup<HeadersStubs, this>;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }
  public get headers(): EasyNetworkStubGroup<HeadersStubs, this> {
    return this._headers ??= createEasyNetworkStubGroup(this, this._stubWrapper, HeadersStubs);
  }

  public resetStubs(): this {
    this._headers?.reset();
    return this;
  }
}
