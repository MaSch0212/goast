import { EasyNetworkStub } from 'easy-network-stub';

import { AlphaStubs } from './stubs/alpha.stubs';
import { BetaStubs } from './stubs/beta.stubs';
import { Service2Stubs } from './stubs/service-2.stubs';
import { TagWithSpaceStubs } from './stubs/tag-with-space.stubs';
import { EasyNetworkStubWrapper, createEasyNetworkStubGroup } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubGroup, EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';

export { AlphaStubs } from './stubs/alpha.stubs';
export { BetaStubs } from './stubs/beta.stubs';
export { Service2Stubs } from './stubs/service-2.stubs';
export { TagWithSpaceStubs } from './stubs/tag-with-space.stubs';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;
  private _alpha?: EasyNetworkStubGroup<AlphaStubs, this>;
  private _service2?: EasyNetworkStubGroup<Service2Stubs, this>;
  private _beta?: EasyNetworkStubGroup<BetaStubs, this>;
  private _tagWithSpace?: EasyNetworkStubGroup<TagWithSpaceStubs, this>;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }
  public get alpha(): EasyNetworkStubGroup<AlphaStubs, this> {
    return this._alpha ??= createEasyNetworkStubGroup(this, this._stubWrapper, AlphaStubs);
  }
  public get service2(): EasyNetworkStubGroup<Service2Stubs, this> {
    return this._service2 ??= createEasyNetworkStubGroup(this, this._stubWrapper, Service2Stubs);
  }
  public get beta(): EasyNetworkStubGroup<BetaStubs, this> {
    return this._beta ??= createEasyNetworkStubGroup(this, this._stubWrapper, BetaStubs);
  }
  public get tagWithSpace(): EasyNetworkStubGroup<TagWithSpaceStubs, this> {
    return this._tagWithSpace ??= createEasyNetworkStubGroup(this, this._stubWrapper, TagWithSpaceStubs);
  }

  public resetStubs(): this {
    this._alpha?.reset();
    this._service2?.reset();
    this._beta?.reset();
    this._tagWithSpace?.reset();
    return this;
  }
}
