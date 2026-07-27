import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';

/**
 * MFE-aware navigation service.
 *
 * When VMS runs standalone, the base path is ''.
 * When loaded as a micro frontend inside the host shell (e.g. under /vms),
 * the base path is '/vms'.
 *
 * This service auto-detects the context and resolves absolute paths correctly,
 * so components can always navigate with simple paths like '/dashboard'.
 */
@Injectable({ providedIn: 'root' })
export class MfeNavigationService {
  private router = inject(Router);
  private ngZone = inject(NgZone);

  /**
   * Detect the MFE base path by checking the current URL.
   * If running under /vms in the host, returns '/vms'.
   * If running standalone, returns ''.
   */
  get basePath(): string {
    const url = window.location.pathname;
    const match = url.match(/^\/(vms)/);
    return match ? `/${match[1]}` : '';
  }

  /**
   * Navigate to a path, automatically prepending the MFE base path.
   * Usage: this.mfeNav.navigate('/dashboard') → navigates to /vms/dashboard in MFE context
   */
  navigate(path: string): void {
    const base = this.basePath;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    this.ngZone.run(() => {
      this.router.navigateByUrl(`${base}${normalizedPath}`);
    });
  }

  /**
   * Navigate by full URL, prepending MFE base if the URL is relative (starts with /).
   */
  navigateByUrl(url: string): void {
    this.ngZone.run(() => {
      if (url.startsWith('/') && !url.startsWith(this.basePath)) {
        this.router.navigateByUrl(`${this.basePath}${url}`);
      } else {
        this.router.navigateByUrl(url);
      }
    });
  }
}
