import { Routes } from '@angular/router';

import { LandingComponent } from './landing/landing.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { VMSLoginComponent } from './login/vms.login.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: VMSLoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/role-dashboard.component').then(m => m.RoleDashboardComponent)
      },
      {
        path: 'candidates',
        loadChildren: () => import('./candidates/candidates.routes').then(m => m.CANDIDATE_ROUTES)
      },
      {
        path: 'clients',
        loadChildren: () => import('./clients/client.routes').then(m => m.CLIENT_ROUTES)
      },
      {
        path: 'jobs',
        loadChildren: () => import('./jobs/job.routes').then(m => m.JOB_ROUTES)
      },
      {
        path: 'users',
        loadChildren: () => import('./users/user.routes').then(m => m.USER_ROUTES)
      },
      {
        path: 'projects',
        loadChildren: () => import('./projects/project.routes').then(m => m.PROJECT_ROUTES)
      },
      {
        path: 'applications',
        loadChildren: () => import('./applications/application.routes').then(m => m.APPLICATION_ROUTES)
      },
      {
        path: 'interviews',
        loadChildren: () => import('./interviews/interview.routes').then(m => m.INTERVIEW_ROUTES)
      },
      {
        path: 'track-applications',
        loadComponent: () => import('./applications/track-application-list/track-application-list.component').then(m => m.TrackApplicationListComponent)
      },
      {
        path: 'vendor-applications',
        loadComponent: () => import('./applications/vendor-application-list/vendor-application-list.component').then(m => m.VendorApplicationListComponent)
      },
      {
        path: 'vendors',
        loadChildren: () => import('./vendors/vendor.routes').then(m => m.VENDOR_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
