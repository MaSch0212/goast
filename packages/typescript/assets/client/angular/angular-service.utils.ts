import { HttpErrorResponse, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, filter, firstValueFrom } from 'rxjs';

export async function waitForResponse<T extends HttpResponse<any> | HttpErrorResponse>(
  httpEvents: Observable<HttpEvent<any>>,
): Promise<T> {
  try {
    const response = await firstValueFrom(httpEvents.pipe(filter((event) => event instanceof HttpResponse)));
    return response as T;
  } catch (error) {
    if (error instanceof HttpErrorResponse) {
      return error as T;
    }
    throw error;
  }
}
