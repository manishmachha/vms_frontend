import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpContext, HttpContextToken } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);

/**
 * Centralized API service that:
 * - Prepends the environment API base URL
 * - Unwraps ApiResponse<T> (extracts .data)
 * - Provides typed HTTP methods
 */
@Injectable()
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  get<T>(path: string, params?: HttpParams, headers?: HttpHeaders, skipLoader = false): Observable<T> {
    const context = new HttpContext().set(SKIP_LOADER, skipLoader);
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}${path}`, { params, headers, context })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  post<T>(path: string, body: any = {}, headers?: HttpHeaders, skipLoader = false): Observable<T> {
    const context = new HttpContext().set(SKIP_LOADER, skipLoader);
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${path}`, body, { headers, context })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  put<T>(path: string, body: any = {}, headers?: HttpHeaders, params?: HttpParams, skipLoader = false): Observable<T> {
    const context = new HttpContext().set(SKIP_LOADER, skipLoader);
    return this.http
      .put<ApiResponse<T>>(`${this.baseUrl}${path}`, body, { headers, params, context })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  patch<T>(path: string, body: any = {}, headers?: HttpHeaders, skipLoader = false): Observable<T> {
    const context = new HttpContext().set(SKIP_LOADER, skipLoader);
    return this.http
      .patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body, { headers, context })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  delete<T>(path: string, headers?: HttpHeaders, skipLoader = false): Observable<T> {
    const context = new HttpContext().set(SKIP_LOADER, skipLoader);
    return this.http
      .delete<ApiResponse<T>>(`${this.baseUrl}${path}`, { headers, context })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  download(path: string, skipLoader = false): Observable<Blob> {
    const context = new HttpContext().set(SKIP_LOADER, skipLoader);
    return this.http
      .get(`${this.baseUrl}${path}`, { responseType: 'blob', context })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    const message = error?.error?.message || error?.message || 'An unexpected error occurred';
    console.error('API Error:', message, error);
    return throwError(() => error);
  }
}
