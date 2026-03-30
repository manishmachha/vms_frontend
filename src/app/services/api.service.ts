import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment.dev';
import { ApiResponse } from '../models/auth.model';

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
  private baseUrl = environment.apiUrl;

  get<T>(path: string, params?: HttpParams, headers?: HttpHeaders): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}${path}`, { params, headers })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  post<T>(path: string, body: any = {}, headers?: HttpHeaders): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${path}`, body, { headers })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  put<T>(path: string, body: any = {}, headers?: HttpHeaders, params?: HttpParams): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(`${this.baseUrl}${path}`, body, { headers, params })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  patch<T>(path: string, body: any = {}, headers?: HttpHeaders): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body, { headers })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  delete<T>(path: string, headers?: HttpHeaders): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(`${this.baseUrl}${path}`, { headers })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  download(path: string): Observable<Blob> {
    return this.http
      .get(`${this.baseUrl}${path}`, { responseType: 'blob' })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    const message = error?.error?.message || error?.message || 'An unexpected error occurred';
    console.error('API Error:', message, error);
    return throwError(() => error);
  }
}
