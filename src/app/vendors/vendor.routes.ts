import { Routes } from '@angular/router';

export const VENDOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./vendor-list/vendor-list.component').then((m) => m.VendorListComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./vendor-create/vendor-create.component').then((m) => m.VendorCreateComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./vendor-detail/vendor-detail.component').then((m) => m.VendorDetailComponent),
  },
];
