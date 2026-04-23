import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from './shared/components/loader/loader.component';

@Component({
  standalone: true,
  selector: 'app-remote-entry',
  imports: [RouterOutlet, LoaderComponent],
  template: `
    <app-loader></app-loader>
    <router-outlet></router-outlet>
  `
})
export class RemoteEntryComponent {}
