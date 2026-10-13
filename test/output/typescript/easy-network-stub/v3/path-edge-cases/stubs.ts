import { EasyNetworkStub } from 'easy-network-stub';

import { PathsStubs } from './stubs/paths.stubs';
import { EasyNetworkStubWrapper, createEasyNetworkStubGroup } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubGroup, EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';

export { PathsStubs } from './stubs/paths.stubs';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;
  private _paths?: EasyNetworkStubGroup<PathsStubs, this>;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }
  public get paths(): EasyNetworkStubGroup<PathsStubs, this> {
    return this._paths ??= createEasyNetworkStubGroup(this, this._stubWrapper, PathsStubs);
  }

  public resetStubs(): this {
    this._paths?.reset();
    return this;
  }
}
