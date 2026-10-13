import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { Error } from '../models/error';
import type { Widget } from '../models/widget';
import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const getWidgetResponder = getStubResponder<{
    200: Widget;
    400: Error;
    401: never;
    403: never;
    404: Error;
    500: Error;
  }>();

export class WidgetsStubs extends EasyNetworkStubBase {
  private static readonly GET_WIDGET_PATH = 'widgets/{id:string}' as const;

  private readonly _getWidgetRequests: (StubRequestInfo<typeof WidgetsStubs.GET_WIDGET_PATH, unknown>)[] = [];

  public get getWidgetRequests(): readonly (StubRequestInfo<typeof WidgetsStubs.GET_WIDGET_PATH, unknown>)[] {
    return this._getWidgetRequests;
  }

  public stubGetWidget(response: StrictRouteResponseCallback<
      unknown,
      typeof WidgetsStubs.GET_WIDGET_PATH,
      typeof getWidgetResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      WidgetsStubs.GET_WIDGET_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._getWidgetRequests.push(request);
        }
        throw await response(getWidgetResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._getWidgetRequests.length = 0;
    super.reset();
  }
}
