import { EasyNetworkStub } from 'easy-network-stub';

import { BodiesStubs } from './stubs/bodies.stubs';
import { EasyNetworkStubWrapper, createEasyNetworkStubGroup } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubGroup, EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';

export { BodiesStubs } from './stubs/bodies.stubs';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;
  private _bodies?: EasyNetworkStubGroup<BodiesStubs, this>;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }
  public get bodies(): EasyNetworkStubGroup<BodiesStubs, this> {
    return this._bodies ??= createEasyNetworkStubGroup(this, this._stubWrapper, BodiesStubs);
  }

  public resetStubs(): this {
    this._bodies?.reset();
    return this;
  }
}
