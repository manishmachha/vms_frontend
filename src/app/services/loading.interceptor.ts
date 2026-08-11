import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from './loading.service';
import { SKIP_LOADER } from './api.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private loadingService = inject(LoadingService);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    console.log('[LoadingInterceptor] Intercepting request:', req.url);
    const skipLoader = req.context.get(SKIP_LOADER);

    if (skipLoader) {
      console.log('[LoadingInterceptor] Skipping loader for:', req.url);
      return next.handle(req);
    }

    console.log('[LoadingInterceptor] Showing loader for:', req.url);
    this.loadingService.show();

    return next.handle(req).pipe(
      finalize(() => {
        console.log('[LoadingInterceptor] Hiding loader for:', req.url);
        this.loadingService.hide();
      }),
    );
  }
}