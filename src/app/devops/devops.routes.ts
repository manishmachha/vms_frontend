import { Routes } from '@angular/router';
import { DevOpsDashboardComponent } from './devops-dashboard/devops-dashboard.component';
import { ContainerListComponent } from './container-list/container-list.component';
import { TerminalComponent } from './terminal/terminal.component';

export const DEVOPS_ROUTES: Routes = [
  {
    path: '',
    component: DevOpsDashboardComponent,
    children: [
      { path: 'containers', component: ContainerListComponent },
      { path: 'terminal', component: TerminalComponent },
      { path: '', redirectTo: 'branches', pathMatch: 'full' }
    ]
  }
];
