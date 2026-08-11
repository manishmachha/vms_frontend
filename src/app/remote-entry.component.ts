import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { MfeNavigationService } from './services/mfe-navigation.service';
import { AuthStore } from './services/auth.store';

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
  private mfeNav = inject(MfeNavigationService);
  private authStore = inject(AuthStore);

  constructor() {
    console.log('VMS RemoteEntryComponent initialized');
  }

  ngOnInit(): void {
  }
}
