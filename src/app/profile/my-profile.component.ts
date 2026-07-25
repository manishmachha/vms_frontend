import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { AuthStore } from '../services/auth.store';
import { HeaderService } from '../services/header.service';
import { User } from '../models/auth.model';
import { DashboardStatsResponse } from '../models/dashboard-stats.model';
import { MfeNavigationService } from '../services/mfe-navigation.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css'],
})
export class MyProfileComponent implements OnInit {
  private userService = inject(UserService);
  private authStore = inject(AuthStore);
  private headerService = inject(HeaderService);
  private mfeNav = inject(MfeNavigationService);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  profile = signal<User | null>(null);
  stats = signal<DashboardStatsResponse | null>(null);

  // Edit profile form
  editForm = { firstName: '', lastName: '', phone: '' };
  profileSaved = signal(false);
  profileError = signal('');

  // Password form
  passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  passwordSaved = signal(false);
  passwordError = signal('');

  // Password visibility toggles
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  ngOnInit() {
    this.headerService.setTitle('My Profile', 'View and manage your account', 'bi bi-person-circle');
    this.loadProfile();
  }

  loadProfile() {
    this.userService.getMe().subscribe({
      next: (user) => {
        this.profile.set(user);
        this.editForm = {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.phone || '',
        };
        if (user.id) {
          this.loadStats(user.id);
        }
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        // Fallback to auth store data
        const storeUser = this.authStore.user();
        if (storeUser) {
          this.profile.set(storeUser);
          this.editForm = {
            firstName: storeUser.firstName || '',
            lastName: storeUser.lastName || '',
            phone: storeUser.phone || '',
          };
        }
      },
    });
  }

  loadStats(userId: number | string) {
    (this.userService as any).getUserStats(userId).subscribe({
      next: (response: any) => {
        if (response && response.stats) {
          this.stats.set(response);
        }
      },
      error: (err: any) => {
        console.error('Failed to load stats', err);
      }
    });
  }

  saveProfile() {
    this.profileError.set('');
    this.profileSaved.set(false);

    this.userService.updateMe(this.editForm).subscribe({
      next: (user) => {
        this.profile.set(user);
        // Update auth store to reflect changes in header
        this.authStore.updateUser({
          ...this.authStore.user()!,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        });
        this.profileSaved.set(true);
        setTimeout(() => this.profileSaved.set(false), 3000);
      },
      error: (err) => {
        this.profileError.set(err?.error?.message || 'Failed to update profile. Please try again.');
      },
    });
  }

  resetForm() {
    const user = this.profile();
    if (user) {
      this.editForm = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      };
    }
    this.profileError.set('');
  }

  changePassword() {
    this.passwordError.set('');
    this.passwordSaved.set(false);

    // Validation
    if (!this.passwordForm.currentPassword) {
      this.passwordError.set('Current password is required.');
      return;
    }
    if (!this.passwordForm.newPassword || this.passwordForm.newPassword.length < 6) {
      this.passwordError.set('New password must be at least 6 characters.');
      return;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordError.set('New password and confirmation do not match.');
      return;
    }

    this.userService
      .changeMyPassword({
        currentPassword: this.passwordForm.currentPassword,
        newPassword: this.passwordForm.newPassword,
      })
      .subscribe({
        next: () => {
          this.passwordSaved.set(true);
          this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
          setTimeout(() => this.passwordSaved.set(false), 3000);
        },
        error: (err) => {
          this.passwordError.set(err?.error?.message || 'Failed to change password. Check your current password.');
        },
      });
  }

  getInitials(): string {
    const user = this.profile();
    if (!user) return '?';
    return ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase();
  }

  formatRole(role: string | undefined): string {
    if (!role) return '';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getRoleBadgeClass(): string {
    const role = this.profile()?.role;
    if (role === 'SUPER_ADMIN') return 'bg-red-100 text-red-700';
    if (role === 'MANAGER') return 'bg-amber-100 text-amber-700';
    if (role === 'TALENT_ACQUISITION') return 'bg-blue-100 text-blue-700';
    if (role === 'VENDOR') return 'bg-emerald-100 text-emerald-700';
    return 'bg-gray-100 text-gray-700';
  }

  getPasswordStrength(): { width: string; color: string; textColor: string; label: string } {
    const pw = this.passwordForm.newPassword;
    if (!pw) return { width: '0%', color: 'bg-gray-200', textColor: 'text-gray-400', label: '' };

    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { width: '20%', color: 'bg-red-500', textColor: 'text-red-500', label: 'Weak' };
    if (score <= 2) return { width: '40%', color: 'bg-orange-500', textColor: 'text-orange-500', label: 'Fair' };
    if (score <= 3) return { width: '60%', color: 'bg-amber-500', textColor: 'text-amber-500', label: 'Good' };
    if (score <= 4) return { width: '80%', color: 'bg-emerald-500', textColor: 'text-emerald-500', label: 'Strong' };
    return { width: '100%', color: 'bg-green-500', textColor: 'text-green-500', label: 'Excellent' };
  }
}
