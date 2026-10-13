import { EasyNetworkStubBase, getStubResponder } from '../utils/easy-network-stub.utils';

import type { StrictRouteResponseCallback, StubRequestInfo } from '../utils/easy-network-stub.utils';

const getItemsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const postItemsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const optionsItemsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const headItemsResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const getItemsIdResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const putItemsIdResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const deleteItemsIdResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const patchItemsIdResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const getItemsIdSubItemsSubIdResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const getResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const getABCDEResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

const getWithSummaryResponder = getStubResponder<{
    200: never;
    401: never;
    403: never;
    500: never;
  }>();

export class NamingStubs extends EasyNetworkStubBase {
  private static readonly GET_ITEMS_PATH = 'items' as const;
  private static readonly POST_ITEMS_PATH = 'items' as const;
  private static readonly OPTIONS_ITEMS_PATH = 'items' as const;
  private static readonly HEAD_ITEMS_PATH = 'items' as const;
  private static readonly GET_ITEMS_ID_PATH = 'items/{id:string}' as const;
  private static readonly PUT_ITEMS_ID_PATH = 'items/{id:string}' as const;
  private static readonly DELETE_ITEMS_ID_PATH = 'items/{id:string}' as const;
  private static readonly PATCH_ITEMS_ID_PATH = 'items/{id:string}' as const;
  private static readonly GET_ITEMS_ID_SUB_ITEMS_SUB_ID_PATH = 'items/{id:string}/sub-items/{subId:string}' as const;
  private static readonly GET_PATH = '' as const;
  private static readonly GET_A_B_C_D_E_PATH = 'a/b/c/d/e' as const;
  private static readonly GET_WITH_SUMMARY_PATH = 'with-summary' as const;

  private readonly _getItemsRequests: (StubRequestInfo<typeof NamingStubs.GET_ITEMS_PATH, unknown>)[] = [];
  private readonly _postItemsRequests: (StubRequestInfo<typeof NamingStubs.POST_ITEMS_PATH, unknown>)[] = [];
  private readonly _optionsItemsRequests: (StubRequestInfo<typeof NamingStubs.OPTIONS_ITEMS_PATH, unknown>)[] = [];
  private readonly _headItemsRequests: (StubRequestInfo<typeof NamingStubs.HEAD_ITEMS_PATH, unknown>)[] = [];
  private readonly _getItemsIdRequests: (StubRequestInfo<typeof NamingStubs.GET_ITEMS_ID_PATH, unknown>)[] = [];
  private readonly _putItemsIdRequests: (StubRequestInfo<typeof NamingStubs.PUT_ITEMS_ID_PATH, unknown>)[] = [];
  private readonly _deleteItemsIdRequests: (StubRequestInfo<typeof NamingStubs.DELETE_ITEMS_ID_PATH, unknown>)[] = [];
  private readonly _patchItemsIdRequests: (StubRequestInfo<typeof NamingStubs.PATCH_ITEMS_ID_PATH, unknown>)[] = [];
  private readonly _getItemsIdSubItemsSubIdRequests: (StubRequestInfo<typeof NamingStubs.GET_ITEMS_ID_SUB_ITEMS_SUB_ID_PATH, unknown>)[] = [];
  private readonly _getRequests: (StubRequestInfo<typeof NamingStubs.GET_PATH, unknown>)[] = [];
  private readonly _getABCDERequests: (StubRequestInfo<typeof NamingStubs.GET_A_B_C_D_E_PATH, unknown>)[] = [];
  private readonly _getWithSummaryRequests: (StubRequestInfo<typeof NamingStubs.GET_WITH_SUMMARY_PATH, unknown>)[] = [];

  public get getItemsRequests(): readonly (StubRequestInfo<typeof NamingStubs.GET_ITEMS_PATH, unknown>)[] {
    return this._getItemsRequests;
  }
  public get postItemsRequests(): readonly (StubRequestInfo<typeof NamingStubs.POST_ITEMS_PATH, unknown>)[] {
    return this._postItemsRequests;
  }
  public get optionsItemsRequests(): readonly (StubRequestInfo<typeof NamingStubs.OPTIONS_ITEMS_PATH, unknown>)[] {
    return this._optionsItemsRequests;
  }
  public get headItemsRequests(): readonly (StubRequestInfo<typeof NamingStubs.HEAD_ITEMS_PATH, unknown>)[] {
    return this._headItemsRequests;
  }
  public get getItemsIdRequests(): readonly (StubRequestInfo<typeof NamingStubs.GET_ITEMS_ID_PATH, unknown>)[] {
    return this._getItemsIdRequests;
  }
  public get putItemsIdRequests(): readonly (StubRequestInfo<typeof NamingStubs.PUT_ITEMS_ID_PATH, unknown>)[] {
    return this._putItemsIdRequests;
  }
  public get deleteItemsIdRequests(): readonly (StubRequestInfo<typeof NamingStubs.DELETE_ITEMS_ID_PATH, unknown>)[] {
    return this._deleteItemsIdRequests;
  }
  public get patchItemsIdRequests(): readonly (StubRequestInfo<typeof NamingStubs.PATCH_ITEMS_ID_PATH, unknown>)[] {
    return this._patchItemsIdRequests;
  }
  public get getItemsIdSubItemsSubIdRequests(): readonly (StubRequestInfo<typeof NamingStubs.GET_ITEMS_ID_SUB_ITEMS_SUB_ID_PATH, unknown>)[] {
    return this._getItemsIdSubItemsSubIdRequests;
  }
  public get getRequests(): readonly (StubRequestInfo<typeof NamingStubs.GET_PATH, unknown>)[] {
    return this._getRequests;
  }
  public get getABCDERequests(): readonly (StubRequestInfo<typeof NamingStubs.GET_A_B_C_D_E_PATH, unknown>)[] {
    return this._getABCDERequests;
  }
  public get getWithSummaryRequests(): readonly (StubRequestInfo<typeof NamingStubs.GET_WITH_SUMMARY_PATH, unknown>)[] {
    return this._getWithSummaryRequests;
  }

  public stubGetItems(response: StrictRouteResponseCallback<
      unknown,
      typeof NamingStubs.GET_ITEMS_PATH,
      typeof getItemsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      NamingStubs.GET_ITEMS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._getItemsRequests.push(request);
        }
        throw await response(getItemsResponder, request);
      }
    );
    return this;
  }

  public stubPostItems(response: StrictRouteResponseCallback<
      unknown,
      typeof NamingStubs.POST_ITEMS_PATH,
      typeof postItemsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'POST',
      NamingStubs.POST_ITEMS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._postItemsRequests.push(request);
        }
        throw await response(postItemsResponder, request);
      }
    );
    return this;
  }

  public stubOptionsItems(response: StrictRouteResponseCallback<
      unknown,
      typeof NamingStubs.OPTIONS_ITEMS_PATH,
      typeof optionsItemsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'OPTIONS',
      NamingStubs.OPTIONS_ITEMS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._optionsItemsRequests.push(request);
        }
        throw await response(optionsItemsResponder, request);
      }
    );
    return this;
  }

  public stubHeadItems(response: StrictRouteResponseCallback<
      unknown,
      typeof NamingStubs.HEAD_ITEMS_PATH,
      typeof headItemsResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'HEAD',
      NamingStubs.HEAD_ITEMS_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._headItemsRequests.push(request);
        }
        throw await response(headItemsResponder, request);
      }
    );
    return this;
  }

  public stubGetItemsId(response: StrictRouteResponseCallback<
      unknown,
      typeof NamingStubs.GET_ITEMS_ID_PATH,
      typeof getItemsIdResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      NamingStubs.GET_ITEMS_ID_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._getItemsIdRequests.push(request);
        }
        throw await response(getItemsIdResponder, request);
      }
    );
    return this;
  }

  public stubPutItemsId(response: StrictRouteResponseCallback<
      unknown,
      typeof NamingStubs.PUT_ITEMS_ID_PATH,
      typeof putItemsIdResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'PUT',
      NamingStubs.PUT_ITEMS_ID_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._putItemsIdRequests.push(request);
        }
        throw await response(putItemsIdResponder, request);
      }
    );
    return this;
  }

  public stubDeleteItemsId(response: StrictRouteResponseCallback<
      unknown,
      typeof NamingStubs.DELETE_ITEMS_ID_PATH,
      typeof deleteItemsIdResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'DELETE',
      NamingStubs.DELETE_ITEMS_ID_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._deleteItemsIdRequests.push(request);
        }
        throw await response(deleteItemsIdResponder, request);
      }
    );
    return this;
  }

  public stubPatchItemsId(response: StrictRouteResponseCallback<
      unknown,
      typeof NamingStubs.PATCH_ITEMS_ID_PATH,
      typeof patchItemsIdResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'PATCH',
      NamingStubs.PATCH_ITEMS_ID_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._patchItemsIdRequests.push(request);
        }
        throw await response(patchItemsIdResponder, request);
      }
    );
    return this;
  }

  public stubGetItemsIdSubItemsSubId(response: StrictRouteResponseCallback<
      unknown,
      typeof NamingStubs.GET_ITEMS_ID_SUB_ITEMS_SUB_ID_PATH,
      typeof getItemsIdSubItemsSubIdResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      NamingStubs.GET_ITEMS_ID_SUB_ITEMS_SUB_ID_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._getItemsIdSubItemsSubIdRequests.push(request);
        }
        throw await response(getItemsIdSubItemsSubIdResponder, request);
      }
    );
    return this;
  }

  public stubGet(response: StrictRouteResponseCallback<
      unknown,
      typeof NamingStubs.GET_PATH,
      typeof getResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      NamingStubs.GET_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._getRequests.push(request);
        }
        throw await response(getResponder, request);
      }
    );
    return this;
  }

  public stubGetABCDE(response: StrictRouteResponseCallback<
      unknown,
      typeof NamingStubs.GET_A_B_C_D_E_PATH,
      typeof getABCDEResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      NamingStubs.GET_A_B_C_D_E_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._getABCDERequests.push(request);
        }
        throw await response(getABCDEResponder, request);
      }
    );
    return this;
  }

  public stubGetWithSummary(response: StrictRouteResponseCallback<
      unknown,
      typeof NamingStubs.GET_WITH_SUMMARY_PATH,
      typeof getWithSummaryResponder
    >): this {
    this.stubWrapper.stub2<unknown>()(
      'GET',
      NamingStubs.GET_WITH_SUMMARY_PATH,
      async (request) => {
        if (this.stubWrapper.options.rememberRequests) {
          this._getWithSummaryRequests.push(request);
        }
        throw await response(getWithSummaryResponder, request);
      }
    );
    return this;
  }

  public override reset(): void {
    this._getItemsRequests.length = 0;
    this._postItemsRequests.length = 0;
    this._optionsItemsRequests.length = 0;
    this._headItemsRequests.length = 0;
    this._getItemsIdRequests.length = 0;
    this._putItemsIdRequests.length = 0;
    this._deleteItemsIdRequests.length = 0;
    this._patchItemsIdRequests.length = 0;
    this._getItemsIdSubItemsSubIdRequests.length = 0;
    this._getRequests.length = 0;
    this._getABCDERequests.length = 0;
    this._getWithSummaryRequests.length = 0;
    super.reset();
  }
}
