import { Injectable, inject } from '@angular/core';
import { AuthStore } from './auth.store';
import { User, AuthResponse, ApiResponse } from '../models/auth.model';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private store = inject(AuthStore);
  private api = inject(ApiService);

  login(credentials: { email: string; password: string }) {
    return this.api
      .post<AuthResponse>(`/v1/auth/login`, credentials)
      .pipe(tap((data: AuthResponse) => this.store.login(data)));
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
    return this.api.post<AuthResponse>(
      `/v1/auth/register`,
      registerRequest,
    );
  }

  logout() {
    this.store.logout();
  }
}
