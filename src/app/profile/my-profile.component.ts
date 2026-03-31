import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { AuthStore } from '../services/auth.store';
import { HeaderService } from '../services/header.service';
import { User } from '../models/auth.model';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-8 p-4 md:p-8 animate-fade-in pb-10">

      <!-- Profile Header Card -->
      <div class="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <!-- Gradient Banner -->
        <div class="h-36 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
          <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50"></div>
        </div>

        <!-- Avatar + Info -->
        <div class="px-8 pb-8 -mt-16 relative z-10">
          <div class="flex flex-col md:flex-row items-start md:items-end gap-6">
            <!-- Avatar -->
            <div class="w-28 h-28 rounded-2xl bg-white shadow-xl border-4 border-white flex items-center justify-center overflow-hidden">
              <div class="w-full h-full rounded-xl bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                <span class="text-4xl font-black text-white">
                  {{ getInitials() }}
                </span>
              </div>
            </div>

            <!-- User Info -->
            <div class="flex-1 min-w-0 pt-2">
              <h1 class="text-2xl md:text-3xl font-bold text-gray-900">
                {{ profile()?.firstName }} {{ profile()?.lastName }}
              </h1>
              <div class="flex flex-wrap items-center gap-3 mt-2">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      [ngClass]="getRoleBadgeClass()">
                  <i class="bi bi-shield-check"></i>
                  {{ formatRole(profile()?.role) }}
                </span>
                <span *ngIf="profile()?.type" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  <i class="bi bi-building"></i>
                  {{ profile()?.type }}
                </span>
                <span *ngIf="profile()?.status !== undefined"
                      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      [ngClass]="profile()?.status ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">
                  <span class="w-1.5 h-1.5 rounded-full" [ngClass]="profile()?.status ? 'bg-emerald-500' : 'bg-red-500'"></span>
                  {{ profile()?.status ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <!-- Left: Personal Information (Read-Only) -->
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
              <i class="bi bi-info-circle text-indigo-500"></i>
              Account Details
            </h3>
            <div class="space-y-5">
              <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email</p>
                <p class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <i class="bi bi-envelope text-indigo-400"></i>
                  {{ profile()?.email }}
                </p>
              </div>
              <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Phone</p>
                <p class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <i class="bi bi-phone text-emerald-400"></i>
                  {{ profile()?.phone || 'Not provided' }}
                </p>
              </div>
              <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">User ID</p>
                <p class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <i class="bi bi-hash text-amber-400"></i>
                  #{{ profile()?.id }}
                </p>
              </div>
              <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Member Since</p>
                <p class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <i class="bi bi-calendar3 text-purple-400"></i>
                  {{ profile()?.createdAt | date:'mediumDate' }}
                </p>
              </div>
              <div *ngIf="profile()?.updatedAt">
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Last Updated</p>
                <p class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <i class="bi bi-clock-history text-rose-400"></i>
                  {{ profile()?.updatedAt | date:'medium' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Edit Profile + Change Password -->
        <div class="lg:col-span-2 space-y-8">

          <!-- Edit Personal Details -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <i class="bi bi-pencil-square text-indigo-500"></i>
                Edit Profile
              </h3>
              <span *ngIf="profileSaved()" class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full animate-fade-in">
                <i class="bi bi-check-circle mr-1"></i> Saved!
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">First Name</label>
                <input
                  type="text"
                  [(ngModel)]="editForm.firstName"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm font-medium text-gray-900 bg-gray-50 focus:bg-white"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Last Name</label>
                <input
                  type="text"
                  [(ngModel)]="editForm.lastName"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm font-medium text-gray-900 bg-gray-50 focus:bg-white"
                  placeholder="Last Name"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                <input
                  type="tel"
                  [(ngModel)]="editForm.phone"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm font-medium text-gray-900 bg-gray-50 focus:bg-white"
                  placeholder="Phone Number"
                />
              </div>
            </div>

            <div class="flex items-center gap-3 mt-6">
              <button
                (click)="saveProfile()"
                class="px-6 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200"
              >
                <i class="bi bi-check2"></i>
                Save Changes
              </button>
              <button
                (click)="resetForm()"
                class="px-6 py-2.5 bg-gray-100 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors"
              >
                Reset
              </button>
            </div>

            <p *ngIf="profileError()" class="mt-3 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              <i class="bi bi-exclamation-triangle mr-1"></i> {{ profileError() }}
            </p>
          </div>

          <!-- Change Password -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <i class="bi bi-lock text-rose-500"></i>
                Change Password
              </h3>
              <span *ngIf="passwordSaved()" class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full animate-fade-in">
                <i class="bi bi-check-circle mr-1"></i> Password changed!
              </span>
            </div>

            <div class="space-y-5">
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Password</label>
                <div class="relative">
                  <input
                    [type]="showCurrentPassword ? 'text' : 'password'"
                    [(ngModel)]="passwordForm.currentPassword"
                    class="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm font-medium text-gray-900 bg-gray-50 focus:bg-white"
                    placeholder="Enter current password"
                  />
                  <button (click)="showCurrentPassword = !showCurrentPassword"
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    <i class="bi" [ngClass]="showCurrentPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                  <div class="relative">
                    <input
                      [type]="showNewPassword ? 'text' : 'password'"
                      [(ngModel)]="passwordForm.newPassword"
                      class="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm font-medium text-gray-900 bg-gray-50 focus:bg-white"
                      placeholder="Enter new password"
                    />
                    <button (click)="showNewPassword = !showNewPassword"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      <i class="bi" [ngClass]="showNewPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                    </button>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm Password</label>
                  <div class="relative">
                    <input
                      [type]="showConfirmPassword ? 'text' : 'password'"
                      [(ngModel)]="passwordForm.confirmPassword"
                      class="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm font-medium text-gray-900 bg-gray-50 focus:bg-white"
                      placeholder="Confirm new password"
                    />
                    <button (click)="showConfirmPassword = !showConfirmPassword"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      <i class="bi" [ngClass]="showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Password strength indicator -->
              <div *ngIf="passwordForm.newPassword" class="space-y-2">
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-300"
                         [style.width]="getPasswordStrength().width"
                         [ngClass]="getPasswordStrength().color"></div>
                  </div>
                  <span class="text-[10px] font-bold uppercase tracking-wider" [ngClass]="getPasswordStrength().textColor">
                    {{ getPasswordStrength().label }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 mt-6">
              <button
                (click)="changePassword()"
                class="px-6 py-2.5 bg-rose-600 text-white font-semibold text-sm rounded-xl hover:bg-rose-700 transition-colors flex items-center gap-2 shadow-sm shadow-rose-200"
              >
                <i class="bi bi-lock"></i>
                Change Password
              </button>
            </div>

            <p *ngIf="passwordError()" class="mt-3 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              <i class="bi bi-exclamation-triangle mr-1"></i> {{ passwordError() }}
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MyProfileComponent implements OnInit {
  private userService = inject(UserService);
  private authStore = inject(AuthStore);
  private headerService = inject(HeaderService);

  profile = signal<User | null>(null);

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
