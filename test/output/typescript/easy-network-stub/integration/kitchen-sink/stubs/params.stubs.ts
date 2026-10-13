import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const allLocationsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const styleMatrixResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const pathStyleSimpleResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const getEncodedResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

export class ParamsStubs extends EasyNetworkStubBase {
  private static readonly ALL_LOCATIONS_PATH = 'locations/{pathParam:string}?{queryParam?:string}' as const;
  private static readonly STYLE_MATRIX_PATH = 'styles?{formExploded?:string[]}&{formUnexploded?:string[]}&{spaceDelimited?:string[]}' as const;
  private static readonly PATH_STYLE_SIMPLE_PATH = 'styles/{values:string[]}' as const;
  private static readonly GET_ENCODED_PATH = 'encoded/{value:string}?{raw?:string}' as const;

  private readonly _allLocationsRequests: (StubRequestInfo<typeof ParamsStubs.ALL_LOCATIONS_PATH, unknown>)[] = [];
  private readonly _styleMatrixRequests: (StubRequestInfo<typeof ParamsStubs.STYLE_MATRIX_PATH, unknown>)[] = [];
  private readonly _pathStyleSimpleRequests: (StubRequestInfo<typeof ParamsStubs.PATH_STYLE_SIMPLE_PATH, unknown>)[] = [];
  private readonly _getEncodedRequests: (StubRequestInfo<typeof ParamsStubs.GET_ENCODED_PATH, unknown>)[] = [];

  public get allLocationsRequests(): readonly (StubRequestInfo<typeof ParamsStubs.ALL_LOCATIONS_PATH, unknown>)[] {
    return this._allLocationsRequests;
  }
  public get styleMatrixRequests(): readonly (StubRequestInfo<typeof ParamsStubs.STYLE_MATRIX_PATH, unknown>)[] {
    return this._styleMatrixRequests;
  }
  public get pathStyleSimpleRequests(): readonly (StubRequestInfo<typeof ParamsStubs.PATH_STYLE_SIMPLE_PATH, unknown>)[] {
    return this._pathStyleSimpleRequests;
  }
  public get getEncodedRequests(): readonly (StubRequestInfo<typeof ParamsStubs.GET_ENCODED_PATH, unknown>)[] {
    return this._getEncodedRequests;
  }

  public stubAllLocations(response: StrictRouteResponseCallback<
      unknown,
      typeof ParamsStubs.ALL_LOCATIONS_PATH,
      typeof allLocationsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ParamsStubs.ALL_LOCATIONS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._allLocationsRequests.push(request);
        }
        throw await response(allLocationsResponder, request);
      }
    );
    return this;
  }

  public stubStyleMatrix(response: StrictRouteResponseCallback<
      unknown,
      typeof ParamsStubs.STYLE_MATRIX_PATH,
      typeof styleMatrixResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ParamsStubs.STYLE_MATRIX_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._styleMatrixRequests.push(request);
        }
        throw await response(styleMatrixResponder, request);
      }
    );
    return this;
  }

  public stubPathStyleSimple(response: StrictRouteResponseCallback<
      unknown,
      typeof ParamsStubs.PATH_STYLE_SIMPLE_PATH,
      typeof pathStyleSimpleResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ParamsStubs.PATH_STYLE_SIMPLE_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._pathStyleSimpleRequests.push(request);
        }
        throw await response(pathStyleSimpleResponder, request);
      }
    );
    return this;
  }

  public stubGetEncoded(response: StrictRouteResponseCallback<
      unknown,
      typeof ParamsStubs.GET_ENCODED_PATH,
      typeof getEncodedResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      ParamsStubs.GET_ENCODED_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._getEncodedRequests.push(request);
        }
        throw await response(getEncodedResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._allLocationsRequests.length = 0;
    this._styleMatrixRequests.length = 0;
    this._pathStyleSimpleRequests.length = 0;
    this._getEncodedRequests.length = 0;
    super.reset();
  }
}
