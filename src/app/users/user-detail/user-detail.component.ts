import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User } from '../../models/auth.model';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';
import { MfeNavigationService } from '../../services/mfe-navigation.service';
import { DashboardStatsResponse } from '../../models/dashboard-stats.model';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, OrganizationLogoComponent],
  templateUrl: './user-detail.component.html',
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private mfeNav = inject(MfeNavigationService);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  user = signal<User | null>(null);
  stats = signal<DashboardStatsResponse | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadUserDetails(id);
      }
    });
  }

  private loadUserDetails(id: string) {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getUser(id).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loadUserStats(id);
      },
      error: (err) => {
        this.error.set('Failed to load user details.');
        this.loading.set(false);
      }
    });
  }

  private loadUserStats(id: string) {
    // We assume getUserStats is implemented in UserService
    (this.userService as any).getUserStats(id).subscribe({
      next: (response: any) => {
        if (response && response.stats) {
          this.stats.set(response);
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load stats', err);
        // Continue without stats
        this.loading.set(false);
      }
    });
  }

  formatRole(role?: string): string {
    if (!role) return '';
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
