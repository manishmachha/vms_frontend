import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthStore } from '../services/auth.store';
import { MatDialog } from '@angular/material/dialog';
import { AccessDeniedDialogComponent } from '../shared/components/access-denied-dialog/access-denied-dialog.component';

export const roleGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const dialog = inject(MatDialog);

  if (!authStore.isAuthenticated()) {
    router.navigate(['/']);
    return false;
  }

  const allowedRoles = route.data?.['roles'] as string[];
  
  if (!allowedRoles || allowedRoles.length === 0) {
    // If no roles specified, allow access
    return true;
  }

  const userRole = authStore.userRole();

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  // User doesn't have required role, show dialog and redirect to dashboard
  dialog.open(AccessDeniedDialogComponent, {
    width: '380px',
    disableClose: true,
    panelClass: 'bg-transparent'
  }).afterClosed().subscribe(() => {
    router.navigate(['/dashboard']);
  });
  
  return false;
};
