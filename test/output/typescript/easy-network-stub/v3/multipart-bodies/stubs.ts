import { EasyNetworkStub } from 'easy-network-stub';

import { MultipartStubs } from './stubs/multipart.stubs';
import { EasyNetworkStubWrapper, createEasyNetworkStubGroup } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubGroup, EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';

export { MultipartStubs } from './stubs/multipart.stubs';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;
  private _multipart?: EasyNetworkStubGroup<MultipartStubs, this>;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }
  public get multipart(): EasyNetworkStubGroup<MultipartStubs, this> {
    return this._multipart ??= createEasyNetworkStubGroup(this, this._stubWrapper, MultipartStubs);
  }

  public resetStubs(): this {
    this._multipart?.reset();
    return this;
  }
}
