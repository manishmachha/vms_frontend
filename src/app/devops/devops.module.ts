import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DevOpsDashboardComponent } from './devops-dashboard/devops-dashboard.component';
import { ContainerListComponent } from './container-list/container-list.component';
import { LogViewerComponent } from './log-viewer/log-viewer.component';
import { TerminalComponent } from './terminal/terminal.component';

const routes: Routes = [
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

@NgModule({
  declarations: [
    DevOpsDashboardComponent,
    ContainerListComponent,
    LogViewerComponent,
    TerminalComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class DevOpsModule { }
