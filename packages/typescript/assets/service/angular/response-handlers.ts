import { HttpErrorResponse } from '@angular/common/http';

import { StrictHttpResponse } from './strict-http-response';

type Response = { status: string; content: unknown };
type PickRsp<T extends Response, K extends T['status']> = Exclude<T, Exclude<T, { status: K }>>;
type ExcludeRsp<T extends Response, K extends T['status']> = Exclude<T, { status: K }>;
type Handeled<T extends string | number | symbol> = { [K in T]: true };
type SuccessCode = `2${number}`;
type SuccessCodes<T extends Response> = Exclude<T['status'], Exclude<T['status'], SuccessCode>>;
type ErrorCode = `${4 | 5}${number}` | 'other';
type ErrorCodes<T extends Response> = Exclude<T['status'], Exclude<T['status'], ErrorCode>>;
type RemoveVoid<T> = T extends void ? never : T;

export class ResponseHandler<
  I extends Response,
  S extends I,
  E extends Handeled<Exclude<I['status'], S['status']>>,
  O,
> {
  private readonly _dummy?: E;
  private readonly _response: I;
  private _isHandeled = false;
  public result: O | PromiseLike<O> = undefined!;

  constructor(response: I) {
    this._response = response;
  }

  public handle<T extends Exclude<S['status'], 'other'>, U = undefined>(
    status: T[] | T,
    handler?: (r: PickRsp<S, T>, status: string) => U | PromiseLike<U>,
  ) {
    const newThis = this.as<ExcludeRsp<S, T>, Handeled<T | keyof E>, RemoveVoid<U>>();
    const matches = Array.isArray(status)
      ? (status as string[]).indexOf(this._response.status.toString()) >= 0
      : this._response.status.toString() === status;
    if (matches && !this._isHandeled) {
      this._isHandeled = true;
      if (handler) {
        newThis.result = handler(this._response as PickRsp<S, T>, this._response.status) as
          | RemoveVoid<U>
          | PromiseLike<RemoveVoid<U>>;
      }
    }
    return newThis;
  }

  public handleSuccess<T = undefined>(handler?: (r: PickRsp<S, SuccessCode>, status: string) => T | PromiseLike<T>) {
    const newThis = this.as<ExcludeRsp<S, SuccessCode>, Handeled<SuccessCodes<S> | keyof E>, RemoveVoid<T>>();
    const matches = this._response.status.startsWith('2');
    if (matches && !this._isHandeled) {
      this._isHandeled = true;
      if (handler) {
        newThis.result = handler(this._response as PickRsp<S, SuccessCode>, this._response.status) as
          | RemoveVoid<T>
          | PromiseLike<RemoveVoid<T>>;
      }
    }
    return newThis;
  }

  public handleError<T = undefined>(handler?: (r: PickRsp<S, ErrorCode>, status: string) => T | PromiseLike<T>) {
    const newThis = this.as<ExcludeRsp<S, ErrorCode>, Handeled<ErrorCodes<S> | keyof E>, RemoveVoid<T>>();
    const matches = this._response.status.startsWith('4') || this._response.status.startsWith('5');
    if (matches && !this._isHandeled) {
      this._isHandeled = true;
      if (handler) {
        newThis.result = handler(this._response as PickRsp<S, ErrorCode>, this._response.status) as
          | RemoveVoid<T>
          | PromiseLike<RemoveVoid<T>>;
      }
    }
    return newThis;
  }

  public throwOnError() {
    const newThis = this.as<ExcludeRsp<S, ErrorCode>, Handeled<ErrorCodes<S> | keyof E>, never>();
    const matches = this._response.status.startsWith('4') || this._response.status.startsWith('5');
    if (matches && !this._isHandeled) {
      throw new UnhandeledResponseError(this._response);
    }
    return newThis;
  }

  private as<NewS extends I, NewE extends Handeled<Exclude<I['status'], NewS['status']>>, NewO>() {
    return this as unknown as ResponseHandler<I, NewS, NewE, O | NewO>;
  }
}

export class UnhandeledResponseError extends Error {
  public readonly response: Response;

  constructor(response: Response) {
    super(`The response with status code '${response.status}' was not handeled.`, { cause: response });
    this.response = response;
  }
}

export type ResponseHandlerFn<T extends Response, O> = (
  handler: ResponseHandler<T, T, object, never>,
) => ResponseHandler<T, never, { [K in T['status']]: true }, O>;

export function handleResponse<R extends Response, O>(
  response: Promise<StrictHttpResponse<unknown>>,
  handler: ResponseHandlerFn<R, O>,
): Promise<O> {
  return response
    .then(
      (r: StrictHttpResponse<unknown>) =>
        <R>{
          status: r.status.toString(),
          content: r.body,
        },
    )
    .catch((e: HttpErrorResponse) => {
      if (!e.status) throw e;
      return <R>{
        status: e.status.toString(),
        content: e.error,
      };
    })
    .then((r: R) => {
      const h = new ResponseHandler<R, R, object, never>(r);
      return handler(h).result;
    });
}
