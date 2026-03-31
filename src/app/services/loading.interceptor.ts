import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { delay, finalize } from 'rxjs/operators';
import { LoadingService } from './loading.service';
import { SKIP_LOADER } from './api.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private loadingService = inject(LoadingService);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Check if the request should skip the loader
    const skipLoader = req.context.get(SKIP_LOADER);

    if (skipLoader) {
      return next.handle(req);
    }

    // Show loader
    this.loadingService.show();

    return next.handle(req).pipe(
      delay(500), // ⏳ Add 500ms delay (adjust as needed)
      finalize(() => {
        this.loadingService.hide();
      }),
    );
  }
}
