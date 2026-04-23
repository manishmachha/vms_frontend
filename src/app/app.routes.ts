import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { VMSLoginComponent } from './login/vms.login.component';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './services/auth.interceptor';
import { LoadingInterceptor } from './services/loading.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RemoteEntryComponent } from './remote-entry.component';
import { importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { ApiService } from './services/api.service';
import { LoadingService } from './services/loading.service';
import { AuthStore } from './services/auth.store';

export const routes: Routes = [
  {
    path: '',
    component: RemoteEntryComponent,
    providers: [
      importProvidersFrom(MatDialogModule),
      provideHttpClient(withInterceptorsFromDi()),
      { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
      { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
      ApiService,
      LoadingService,
      AuthStore,
    ],
    children: [
      { path: '', component: VMSLoginComponent },
      {
        path: '',
        component: MainLayoutComponent,
        children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/role-dashboard.component').then((m) => m.RoleDashboardComponent),
      },
      {
        path: 'candidates',
        loadChildren: () =>
          import('./candidates/candidates.routes').then((m) => m.CANDIDATE_ROUTES),
      },
      {
        path: 'clients',
        loadChildren: () => import('./clients/client.routes').then((m) => m.CLIENT_ROUTES),
      },
      {
        path: 'jobs',
        loadChildren: () => import('./jobs/job.routes').then((m) => m.JOB_ROUTES),
      },
      {
        path: 'users',
        loadChildren: () => import('./users/user.routes').then((m) => m.USER_ROUTES),
      },
      {
        path: 'projects',
        loadChildren: () => import('./projects/project.routes').then((m) => m.PROJECT_ROUTES),
      },
      {
        path: 'applications',
        loadChildren: () =>
          import('./applications/application.routes').then((m) => m.APPLICATION_ROUTES),
      },
      {
        path: 'interviews',
        loadChildren: () => import('./interviews/interview.routes').then((m) => m.INTERVIEW_ROUTES),
      },
      {
        path: 'track-applications',
        loadComponent: () =>
          import('./applications/track-application-list/track-application-list.component').then(
            (m) => m.TrackApplicationListComponent,
          ),
      },
      {
        path: 'vendor-applications',
        loadComponent: () =>
          import('./applications/vendor-application-list/vendor-application-list.component').then(
            (m) => m.VendorApplicationListComponent,
          ),
      },
      {
        path: 'vendors',
        loadChildren: () => import('./vendors/vendor.routes').then((m) => m.VENDOR_ROUTES),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/my-profile.component').then((m) => m.MyProfileComponent),
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./login/vms.login.component').then((m) => m.VMSLoginComponent),
      },
    ],
  },
  ]
  },
  { path: '**', redirectTo: '' },
];
