import { computed, Injectable, signal } from '@angular/core';
import { User, AuthResponse } from '../models/auth.model';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  // State signal
  private state = signal<AuthState>(initialState);

  // View Role Signal (for simulation)
  private _viewRole = signal<string | null>(null);

  // Selectors (Computed)
  readonly user = computed(() => this.state().user);
  readonly isAuthenticated = computed(() => this.state().isAuthenticated);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);
  readonly accessToken = computed(() => this.state().accessToken);

  // The actual role of the logged-in user (immutable by view toggle)
  readonly actualRole = computed(() => {
    return this.state().user?.role || null;
  });

  // The effective role (affected by view toggle)
  readonly userRole = computed(() => {
    return this._viewRole() || this.actualRole();
  });

  // Expose view role for UI binding
  readonly viewRole = computed(() => this._viewRole());

  // Derive orgType from user.type
  readonly orgType = computed(() => this.state().user?.type || null);
  readonly organizationId = computed(() => this.state().user?.organizationId || this.state().user?.orgId || null);

  readonly permissions = computed(() => {
    return [];
  });

  hasPermission(code: string): boolean {
    if (this.actualRole() === 'SUPER_ADMIN') return true;
    return false;
  }

  // Role Helper Methods
  isSuperAdmin(): boolean {
    return this.userRole() === 'SUPER_ADMIN';
  }

  isHRAdmin(): boolean {
    return this.userRole() === 'MANAGER';
  }

  isTA(): boolean {
    return this.userRole() === 'TALENT_ACQUISITION';
  }

  isEmployee(): boolean {
    return this.userRole() === 'EMPLOYEE';
  }

  isVendor(): boolean {
    return this.userRole() === 'VENDOR';
  }

  isAdmin(): boolean {
    return ['SUPER_ADMIN', 'MANAGER'].includes(this.userRole() || '');
  }

  constructor() {
    this.loadFromStorage();
  }

  // Actions
  login(response: AuthResponse) {
    const user: User = {
      id: response.id,
      firstName: response.firstName,
      lastName: response.lastName,
      email: response.email,
      role: response.role,
      organizationId: response.orgId,
      orgId: response.orgId,
      type: response.userType,
    };

    this.state.set({
      user,
      accessToken: response.token,
      refreshToken: null,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    this.saveToStorage(response.token, null, user);
  }

  updateUser(user: User) {
    this.state.update((s) => ({
      ...s,
      user,
    }));
    // Update local storage user but keep tokens
    const current = sessionStorage.getItem('user');
    if (current) {
      sessionStorage.setItem('user', JSON.stringify(user));
    }
  }

  setViewRole(role: string | null) {
    // If the requested view role is the same as actual role, clear the view role
    if (role === this.actualRole()) {
      this._viewRole.set(null);
    } else {
      this._viewRole.set(role);
    }
  }

  logout() {
    this.state.set(initialState);
    this._viewRole.set(null);
    this.clearStorage();
  }

  setLoading(isLoading: boolean) {
    this.state.update((s) => ({ ...s, isLoading }));
  }

  setError(error: string) {
    this.state.update((s) => ({ ...s, error, isLoading: false }));
  }

  // Storage Handling
  private saveToStorage(accessToken: string, refreshToken: string | null, user: User) {
    sessionStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      sessionStorage.setItem('refresh_token', refreshToken);
    }
    sessionStorage.setItem('user', JSON.stringify(user));
  }

  private loadFromStorage() {
    const accessToken = sessionStorage.getItem('access_token');
    const refreshToken = sessionStorage.getItem('refresh_token');
    const userStr = sessionStorage.getItem('user');

    if (accessToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.state.set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (e) {
        console.error('Failed to parse user from storage', e);
        this.logout();
      }
    }
  }

  private clearStorage() {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
  }
}
