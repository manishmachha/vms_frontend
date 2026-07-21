import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { MfeRouteStateService } from './services/mfe-route-state.service';
import { MfeNavigationService } from './services/mfe-navigation.service';
import { AuthStore } from './services/auth.store';
import { filter, take } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-remote-entry',
  imports: [RouterOutlet, LoaderComponent],
  template: `
    <app-loader></app-loader>
    <router-outlet></router-outlet>
  `
})
export class RemoteEntryComponent implements OnInit {
  private routeState = inject(MfeRouteStateService);
  private mfeNav = inject(MfeNavigationService);
  private authStore = inject(AuthStore);
  private router = inject(Router);

  constructor() {
    console.log('VMS RemoteEntryComponent initialized');
  }

  ngOnInit(): void {
    // Start tracking route changes for state persistence
    this.routeState.startTracking();

    // Attempt to restore the last visited route if the user is authenticated
    this.restoreSavedRoute();
  }

  /**
   * On first load, if the user is authenticated and a saved route exists,
   * redirect to that route instead of the default landing page.
   *
   * We wait for the first NavigationEnd to ensure the router has finished
   * its initial navigation before attempting a redirect — this prevents
   * race conditions and duplicate navigation events.
   */
  private restoreSavedRoute(): void {
    if (!this.authStore.isAuthenticated()) {
      return;
    }

    const savedRoute = this.routeState.getSavedRoute();
    if (!savedRoute || savedRoute === '/' || savedRoute === '/dashboard') {
      return; // No meaningful route to restore
    }

    // Wait for the initial navigation to complete, then redirect
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        take(1),
      )
      .subscribe(() => {
        this.mfeNav.navigate(savedRoute);
      });
  }
}
