import { EasyNetworkStub } from 'easy-network-stub';

import { StylesStubs } from './stubs/styles.stubs';
import { EasyNetworkStubWrapper, createEasyNetworkStubGroup } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubGroup, EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';

export { StylesStubs } from './stubs/styles.stubs';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;
  private _styles?: EasyNetworkStubGroup<StylesStubs, this>;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }
  public get styles(): EasyNetworkStubGroup<StylesStubs, this> {
    return this._styles ??= createEasyNetworkStubGroup(this, this._stubWrapper, StylesStubs);
  }

  public resetStubs(): this {
    this._styles?.reset();
    return this;
  }
}
