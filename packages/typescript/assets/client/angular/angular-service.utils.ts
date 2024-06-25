import { HttpErrorResponse, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, Subscription, filter, take, map, catchError, EMPTY } from 'rxjs';

export type AbortablePromise<T> = Omit<Promise<T>, 'then' | 'catch' | 'finally'> & {
  abort(): void;
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): AbortablePromise<TResult1 | TResult2>;
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
  ): AbortablePromise<T | TResult>;
  finally(onfinally?: (() => void) | undefined | null): AbortablePromise<T>;
};

export function waitForResponse<T extends HttpResponse<any> | HttpErrorResponse>(
  httpEvents: Observable<HttpEvent<any>>,
  options: { errorResponseTypes: Record<number, 'text' | 'json'> },
): AbortablePromise<T> {
  return firstValueFromAbortable<T>(
    httpEvents.pipe(
      filter((event) => event instanceof HttpResponse),
      map((response) => response as T),
    ),
  ).catch((error) => {
    if (error instanceof HttpErrorResponse) {
      if (options.errorResponseTypes[error.status] === 'json' && typeof error.error === 'string') {
        return new HttpErrorResponse({
          error: JSON.parse(error.error),
          headers: error.headers,
          status: error.status,
          statusText: error.statusText,
          url: error.url ?? undefined,
        }) as T;
      }
      return error as T;
    }
    throw error;
  });
}

function firstValueFromAbortable<T>(observable: Observable<T>): AbortablePromise<T> {
  let subscription: Subscription | undefined = undefined;
  let _reject: ((reason?: any) => void) | undefined = undefined;
  const abortFn = () => {
    if (!subscription) {
      throw new Error('Not subscribed yet.');
    }
    subscription.unsubscribe();
    _reject?.(new DOMException('The request has been aborted.', 'AbortError'));
  };

  return createAbortablePromise(
    new Promise<T>((resolve, reject) => {
      _reject = reject;
      subscription = observable
        .pipe(
          take(1),
          catchError((e: unknown) => {
            reject(e);
            return EMPTY;
          }),
        )
        .subscribe((x: T) => resolve(x));
    }),
    abortFn,
  );
}

function createAbortablePromise<T>(promise: Promise<T>, abortFn: () => void) {
  const thenFn = promise.then.bind(promise);
  const catchFn = promise.catch.bind(promise);
  const finallyFn = promise.finally?.bind(promise);
  return Object.assign(promise, {
    then: (...args: any[]) => createAbortablePromise(thenFn(...args), abortFn),
    catch: (...args: any[]) => createAbortablePromise(catchFn(...args), abortFn),
    finally: finallyFn ? (...args: any[]) => createAbortablePromise(finallyFn(...args), abortFn) : undefined,
    abort: abortFn,
  });
}
