import type { EasyNetworkStub } from 'easy-network-stub';

import type { ErrorResponse, HttpMethod, RouteResponseCallback } from 'easy-network-stub';

/**
 * Options for the `EasyNetworkStubWrapper`.
 */
export type EasyNetworkStubWrapperOptions = {
  /**
   * Delay in milliseconds before responding.
   * @default 0
   */
  delay: number;
  /**
   * Whether to log requests to the console.
   * @default false
   */
  logRequests: boolean;
  /**
   * Whether to log responses to the console.
   * @default false
   */
  logResponses: boolean;
  /**
   * Whether to remember requests. Remebered requests can be accessed via the `requests` property.
   * @default false
   */
  rememberRequests: boolean;
  /**
   * Function to call when a response is sent.
   * @param response The response that was sent.
   * @default undefined
   */
  responseCallback?: (response: unknown) => void;
  /**
   * A prefix to add to the URL in log messages.
   * @default /api/
   */
  logUrlPrefix: string;
};

/**
 * Represents a request intercepted by the `EasyNetworkStubWrapper`.
 */
export type StubRequestItem = {
  /**
   * The HTTP method of the request.
   */
  method: HttpMethod;
  /**
   * The route of the request.
   */
  route: string;
  /**
   * The request information provided by `easy-network-stub`.
   */
  request: StubRequestInfo;
};

/**
 * Represents the request information provided by `easy-network-stub`.
 */
export type StubRequestInfo<TRoute extends string = string, TBody = unknown> = Parameters<
  RouteResponseCallback<TRoute, TBody>
>[0];

/**
 * A strict version of `RouteResponseCallback` that allows for a responder to be passed as the first argument.
 */
export type StrictRouteResponseCallback<T, P extends string, R> = (
  respondWith: R,
  ...args: Parameters<RouteResponseCallback<P, T>>
) => ErrorResponse<any> | Promise<ErrorResponse<any>>;

type _UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
type __StubResponder<T extends Record<number, unknown>, S> = S extends number
  ? [T[S]] extends [never] ? (statusCode: S) => ErrorResponse<T[S]>
  : (statusCode: S, content: T[S]) => ErrorResponse<T[S]>
  : never;
type _StubResponder<T extends Record<number, unknown>> = _UnionToIntersection<__StubResponder<T, keyof T>>;
const untypedResponder = (statusCode: number, content?: unknown) => ({ statusCode, content });

/**
 * Gets the responder function typed to a specific set of status codes.
 * @returns The responder function.
 */
export function getStubResponder<T extends Record<number, unknown>>(): _StubResponder<T> {
  return untypedResponder as _StubResponder<T>;
}

/**
 * Wrapper for `EasyNetworkStub` that adds additional functionality.
 */
export class EasyNetworkStubWrapper {
  private _requests: StubRequestItem[] = [];

  /**
   * The options for the wrapper.
   */
  public readonly options: Readonly<EasyNetworkStubWrapperOptions>;

  /**
   * The requests that have been intercepted by the wrapper.
   */
  public get requests(): ReadonlyArray<StubRequestItem> {
    return this._requests;
  }

  constructor(
    public readonly wrappedStub: EasyNetworkStub,
    options?: Partial<EasyNetworkStubWrapperOptions>,
  ) {
    this.options = {
      delay: options?.delay ?? 0,
      logRequests: options?.logRequests ?? false,
      logResponses: options?.logResponses ?? false,
      rememberRequests: options?.rememberRequests ?? false,
      responseCallback: options?.responseCallback,
      logUrlPrefix: options?.logUrlPrefix ?? '/api/',
    };
  }

  /**
   * Add a single api stub to your intercepted routes.
   * @param method The http method that should be stubbed
   * @param route The route that should be stubbed. Supports parameters in the form of {name:type}.
   * @param response The callback in which you can process the request and reply with the stub. When a Promise is returned, the stub response will be delayed until it is resolved.
   */
  public stub<Route extends string>(
    method: HttpMethod,
    route: Route,
    response: RouteResponseCallback<Route, unknown>,
  ): void {
    this.wrappedStub.stub<Route>(method, route, async (request) => {
      if (this.options.delay > 0) await sleep(this.options.delay);
      return await this.runRequest(method, route, response, request);
    });
  }

  /**
   * The stub2 method provides a way to set the type of the body that is sent.
   * Due to restrictions in TypeScript (https://github.com/microsoft/TypeScript/issues/10571, https://github.com/Microsoft/TypeScript/pull/26349),
   * We have to hacke a bit here. Calling stub2<T>() will return the stub method with a body of type T.
   *
   * Usage:
   * ```
   * .stub2<MyRequest>()('GET', '/api/test', ({ body }) => {
   *   // body is of type MyRequest
   * });
   * ```
   * @returns The stub method with a body of type T.
   */
  public stub2<T>(): <Route extends string>(
    method: HttpMethod,
    route: Route,
    response: RouteResponseCallback<Route, T>,
  ) => void {
    return <Route extends string>(method: HttpMethod, route: Route, response: RouteResponseCallback<Route, T>) => {
      this.wrappedStub.stub2<T>()<Route>(method, route, async (request) => {
        if (this.options.delay > 0) await sleep(this.options.delay);
        return await this.runRequest(method, route, response, request);
      });
    };
  }

  /**
   * Reset the stubs and requests.
   */
  public reset(): void {
    this._requests = [];
    this.wrappedStub['_config'].stubs = [];
  }

  private async runRequest<Route extends string, T>(
    method: HttpMethod,
    route: Route,
    response: RouteResponseCallback<Route, T>,
    request: StubRequestInfo<Route, T>,
  ): Promise<unknown> {
    if (this.options.rememberRequests) {
      this._requests.push({ method, route, request });
    }
    this.log('request', method, route, request, '#7FFFFF');
    try {
      const r = await response(request);
      this.options.responseCallback?.(r);
      this.log('response', method, route, r, '#7FFF8E');
      return r;
    } catch (error: unknown) {
      this.options.responseCallback?.(error);
      if (isHttpResponse(error) && error.statusCode >= 200 && error.statusCode < 300) {
        this.log('response', method, route, error.content, '#7FFF8E');
        throw error;
      } else {
        const isError = isHttpResponse(error) && error.statusCode >= 400 && error.statusCode < 600;
        this.log('response', method, route, error, isError ? '#FF7F7F' : '7F7F7F');
        throw error;
      }
    }
  }

  private log(type: 'request' | 'response', method: HttpMethod, route: string, data: unknown, color: string) {
    if (type === 'request' && !this.options.logRequests) return;
    if (type === 'response' && !this.options.logResponses) return;
    const typeDisplay = type === 'request' ? ' [req]' : '[resp]';
    const strippedRoute = route.match(/[^?]*(?=\?)?/)?.[0];
    console.log(`%c${typeDisplay} ${method}: ${this.options.logUrlPrefix}${strippedRoute}`, `color:${color};`, data);
  }
}

/**
 * Base class for generated easy network stubs.
 */
export class EasyNetworkStubBase {
  protected readonly stubWrapper: EasyNetworkStubWrapper;
  protected readonly ownsStubWrapper: boolean;

  constructor(stub: EasyNetworkStub | EasyNetworkStubWrapper, options?: EasyNetworkStubWrapperOptions) {
    this.stubWrapper = stub instanceof EasyNetworkStubWrapper ? stub : new EasyNetworkStubWrapper(stub, options);
    this.ownsStubWrapper = !(stub instanceof EasyNetworkStubWrapper);
  }

  public reset() {
    if (this.ownsStubWrapper) {
      this.stubWrapper.reset();
    }
  }
}

export type EasyNetworkStubGroup<Group, GroupContainer> = Group & {
  (stubActions: (stubs: Group) => void): GroupContainer;
};

// eslint-disable-next-line @typescript-eslint/ban-types
declare interface GroupType<T> extends Function {
  new (stubWrapper: EasyNetworkStubWrapper): T;
}

export function createEasyNetworkStubGroup<GroupContainer, Group>(
  container: GroupContainer,
  stubWrapper: EasyNetworkStubWrapper,
  groupType: GroupType<Group>,
): EasyNetworkStubGroup<Group, GroupContainer> {
  const group = new groupType(stubWrapper);
  const groupFn = (stubActions: (stubs: Group) => void) => {
    stubActions(group);
    return container;
  };
  Object.setPrototypeOf(groupFn, groupType.prototype);
  return Object.assign(groupFn, group);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isHttpResponse(value: unknown): value is ErrorResponse<unknown> {
  return typeof value === 'object' && value !== null && 'statusCode' in value;
}
