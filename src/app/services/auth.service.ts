import { Injectable, inject } from '@angular/core';
import { AuthStore } from './auth.store';
import { User, AuthResponse, ApiResponse } from '../models/auth.model';
import { tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.dev';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private store = inject(AuthStore);
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  login(credentials: { email: string; password: string }) {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.baseUrl}/v1/auth/login`, credentials)
      .pipe(tap((response: ApiResponse<AuthResponse>) => this.store.login(response.data)));
  }

  registerVendor(data: any) {
    const registerRequest = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      phone: data.phone || '',
      type: 'VENDOR',
      role: 'VENDOR',
    };
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.baseUrl}/v1/auth/register`,
      registerRequest,
    );
  }

  logout() {
    this.store.logout();
  }
}
