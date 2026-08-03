import { Component, inject, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { AuthStore } from '../../../services/auth.store';
import { HeaderService } from '../../../services/header.service';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown.component';
import { AuthService } from '../../../services/auth.service';
import { MfeNavigationService } from '../../../services/mfe-navigation.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UserAvatarComponent,
    NotificationDropdownComponent,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  @Input() sidebarOpen = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  headerService = inject(HeaderService);
  authStore = inject(AuthStore);
  authService = inject(AuthService);
  router = inject(Router);
  mfeNav = inject(MfeNavigationService);

  user = this.authStore.user;

  logout() {
    this.authService.logout();
    this.mfeNav.navigate('/');
  }

  formatRole(role: any): string {
    if (!role) return '';
    const roleName = typeof role === 'string' ? role : '';
    return roleName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }
}
