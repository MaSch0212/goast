import { EasyNetworkStub } from 'easy-network-stub';

import { TicketsStubs } from './stubs/tickets.stubs';
import { EasyNetworkStubWrapper, createEasyNetworkStubGroup } from './utils/easy-network-stub.utils';

import type { EasyNetworkStubGroup, EasyNetworkStubWrapperOptions, StubRequestItem } from './utils/easy-network-stub.utils';

export { TicketsStubs } from './stubs/tickets.stubs';


export class ApiStubs {
  private readonly _stubWrapper: EasyNetworkStubWrapper;
  private _tickets?: EasyNetworkStubGroup<TicketsStubs, this>;

  constructor(stub: EasyNetworkStub, options?: Partial<EasyNetworkStubWrapperOptions>) {
    this._stubWrapper = new EasyNetworkStubWrapper(stub, options);
  }

  public get requests(): readonly (StubRequestItem)[] {
    return this._stubWrapper.requests;
  }
  public get tickets(): EasyNetworkStubGroup<TicketsStubs, this> {
    return this._tickets ??= createEasyNetworkStubGroup(this, this._stubWrapper, TicketsStubs);
  }

  public resetStubs(): this {
    this._tickets?.reset();
    return this;
  }
}
