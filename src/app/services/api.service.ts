import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpContext, HttpContextToken } from '@angular/common/http';
import { Observable, throwError, defer } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { LoadingService } from './loading.service';

export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);

/**
 * Centralized API service that:
 * - Prepends the environment API base URL
 * - Unwraps ApiResponse<T> (extracts .data)
 * - Provides typed HTTP methods
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private loadingService = inject(LoadingService);
  private baseUrl = environment.apiUrl;

  private wrapWithLoader<T>(req: Observable<T>, skipLoader: boolean): Observable<T> {
    if (skipLoader) {
      return req;
    }
    return defer(() => {
      this.loadingService.show();
      return req.pipe(
        finalize(() => {
          this.loadingService.hide();
        })
      );
    });
  }

  get<T>(path: string, params?: HttpParams, headers?: HttpHeaders, skipLoader = false): Observable<T> {
    const context = new HttpContext().set(SKIP_LOADER, skipLoader);
    const req = this.http
      .get<ApiResponse<T>>(`${this.baseUrl}${path}`, { params, headers, context })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
    return this.wrapWithLoader(req, skipLoader);
  }

  post<T>(path: string, body: any = {}, headers?: HttpHeaders, skipLoader = false): Observable<T> {
    const context = new HttpContext().set(SKIP_LOADER, skipLoader);
    const req = this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${path}`, body, { headers, context })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
    return this.wrapWithLoader(req, skipLoader);
  }

  put<T>(path: string, body: any = {}, headers?: HttpHeaders, params?: HttpParams, skipLoader = false): Observable<T> {
    const context = new HttpContext().set(SKIP_LOADER, skipLoader);
    const req = this.http
      .put<ApiResponse<T>>(`${this.baseUrl}${path}`, body, { headers, params, context })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
    return this.wrapWithLoader(req, skipLoader);
  }

  patch<T>(path: string, body: any = {}, headers?: HttpHeaders, skipLoader = false): Observable<T> {
    const context = new HttpContext().set(SKIP_LOADER, skipLoader);
    const req = this.http
      .patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body, { headers, context })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
    return this.wrapWithLoader(req, skipLoader);
  }

  delete<T>(path: string, headers?: HttpHeaders, skipLoader = false): Observable<T> {
    const context = new HttpContext().set(SKIP_LOADER, skipLoader);
    const req = this.http
      .delete<ApiResponse<T>>(`${this.baseUrl}${path}`, { headers, context })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
    return this.wrapWithLoader(req, skipLoader);
  }

  download(path: string, skipLoader = false): Observable<Blob> {
    const context = new HttpContext().set(SKIP_LOADER, skipLoader);
    const req = this.http
      .get(`${this.baseUrl}${path}`, { responseType: 'blob', context })
      .pipe(catchError(this.handleError));
    return this.wrapWithLoader(req, skipLoader);
  }

  private handleError(error: any): Observable<never> {
    const message = error?.error?.message || error?.message || 'An unexpected error occurred';
    console.error('API Error:', message, error);
    return throwError(() => error);
  }
}
