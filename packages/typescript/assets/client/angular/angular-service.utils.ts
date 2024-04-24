import { HttpErrorResponse, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, filter, firstValueFrom } from 'rxjs';

export async function waitForResponse<T extends HttpResponse<any> | HttpErrorResponse>(
  httpEvents: Observable<HttpEvent<any>>,
  options: { errorResponseTypes: Record<number, 'text' | 'json'> },
): Promise<T> {
  try {
    const response = await firstValueFrom(httpEvents.pipe(filter((event) => event instanceof HttpResponse)));
    return response as T;
  } catch (error) {
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
  }
}
