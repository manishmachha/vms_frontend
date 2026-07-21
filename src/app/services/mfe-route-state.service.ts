import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';

/**
 * Tracks and persists the last visited route within the VMS microfrontend.
 *
 * When running inside the shell (under /vms), this service strips the
 * MFE prefix and stores only the internal path (e.g. '/candidates/123').
 * On re-entry, the saved route can be retrieved and navigated to,
 * restoring the user to exactly where they left off.
 *
 * Storage is session-scoped (sessionStorage) and cleared on logout.
 */
@Injectable({ providedIn: 'root' })
export class MfeRouteStateService implements OnDestroy {
  private readonly MFE_NAME = 'vms';
  private readonly STORAGE_KEY = `mfe_last_route_${this.MFE_NAME}`;
  private readonly BASE_PATH_REGEX = /^\/vms/;

  private router = inject(Router);
  private subscription: Subscription | null = null;

  /**
   * Begin listening to NavigationEnd events and persisting the current route.
   * Should be called once from RemoteEntryComponent.
   */
  startTracking(): void {
    if (this.subscription) {
      return; // Already tracking
    }

    this.subscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const internalPath = this.stripBasePath(event.urlAfterRedirects || event.url);

        // Don't save the root/login path — only save authenticated routes
        if (internalPath && internalPath !== '/' && internalPath !== '') {
          sessionStorage.setItem(this.STORAGE_KEY, internalPath);
        }
      });
  }

  /**
   * Retrieve the last saved internal route, or null if none exists.
   */
  getSavedRoute(): string | null {
    return sessionStorage.getItem(this.STORAGE_KEY);
  }

  /**
   * Clear the saved route. Called during logout to prevent
   * restoring stale routes on the next login.
   */
  clearSavedRoute(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Strip the MFE base path (e.g. '/vms') from a full URL,
   * returning only the internal route path with query params and fragments.
   */
  private stripBasePath(url: string): string {
    return url.replace(this.BASE_PATH_REGEX, '') || '/';
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
