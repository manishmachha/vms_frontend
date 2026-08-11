import { Component, signal, inject, NgZone, ApplicationRef, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('vms_frontend');
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private appRef = inject(ApplicationRef);

  ngOnInit() {
    // In MFE setups, native click events on routerLinks sometimes execute outside the Angular zone
    // or change detection doesn't trigger immediately, requiring a double click to navigate.
    // Subscribing to NavigationEnd and forcing a tick ensures the view updates on the first click.
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.ngZone.run(() => {
        this.appRef.tick();
      });
    });
  }
}
