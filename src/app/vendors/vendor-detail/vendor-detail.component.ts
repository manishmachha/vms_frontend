import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { Organization, Vendor } from '../../models/organization.model';
import { HeaderService } from '../../services/header.service';
import { AuthStore } from '../../services/auth.store';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';
import { OrganizationService } from '../../services/organization.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Job } from '../../models/job.model';
import { DialogService } from '../../services/dialog.service';
import { AuthService } from '../../services/auth.service';
import { HubDashboardBannerComponent } from '../../shared/components/hub-dashboard-banner/hub-dashboard-banner.component';
import { DashboardStatsResponse } from '../../models/dashboard-stats.model';

@Component({
  selector: 'app-vendor-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTabsModule,
    MatSelectModule,
    OrganizationLogoComponent,
    FormsModule,
    HubDashboardBannerComponent,
  ],
  template: `
    <div class=" mx-auto space-y-8 p-6">

      <ng-container *ngIf="vendor() as organization">
        <!-- Dashboard Banner -->
        <app-hub-dashboard-banner [stats]="dashboardStats()?.stats || []"></app-hub-dashboard-banner>

        <!-- Header Card -->
        <div
          class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden"
        >
          <!-- Abstract Background for aesthetic pop -->
          <div
            class="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl opacity-60 -mr-20 -mt-20 pointer-events-none"
          ></div>

          <div class="relative shrink-0 z-10">
            <app-organization-logo
              [org]="organization"
              size="2xl"
              [rounded]="true"
            ></app-organization-logo>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0 z-10">
            <div class="flex items-center gap-3 mb-2 flex-wrap">
              <h1 class="text-3xl font-bold text-gray-900 truncate">{{ organization.name }}</h1>
              <span class="badge badge-primary">{{ organization.orgType }}</span>
              <span class="badge" [ngClass]="organization.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'">
                {{ organization.status }}
              </span>
            </div>



            <!-- Key Details Grid in Header -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm mb-2">
              <!-- Location & Web -->
              <div class="space-y-2">
                <div
                  *ngIf="organization.address"
                  class="flex items-center gap-2 text-gray-700"
                >
                  <div
                    class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0"
                  >
                    <mat-icon class="text-lg">location_on</mat-icon>
                  </div>
                  <span>
                    {{ organization.address }}
                  </span>
                </div>
              </div>

              <!-- Contact Info -->
              <div class="space-y-2">
                <div *ngIf="organization.email" class="flex items-center gap-2 text-gray-700">
                  <div
                    class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0"
                  >
                    <mat-icon class="text-lg">email</mat-icon>
                  </div>
                  <span class="truncate">{{ organization.email }}</span>
                </div>
                <div *ngIf="organization.phone" class="flex items-center gap-2 text-gray-700">
                  <div
                    class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0"
                  >
                    <mat-icon class="text-lg">phone</mat-icon>
                  </div>
                  <span>{{ organization.phone }}</span>
                </div>
              </div>
            </div>


          </div>

          <!-- Actions Column -->
          <div class="flex flex-col gap-2 mt-4 md:mt-0 ml-auto min-w-[200px] z-10" *ngIf="canUpdateStatus()">
            <button
              *ngIf="organization.status === 'ACTIVE'"
              (click)="updateStatus('INACTIVE')"
              class="w-full py-2.5 px-4 bg-amber-50 text-amber-600 font-medium rounded-xl hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
            >
              <i class="bi bi-pause-circle"></i> Deactivate Vendor
            </button>
            <button
              *ngIf="organization.status === 'INACTIVE'"
              (click)="updateStatus('ACTIVE')"
              class="w-full py-2.5 px-4 bg-emerald-50 text-emerald-600 font-medium rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
            >
              <i class="bi bi-play-circle"></i> Activate Vendor
            </button>
            
            <div class="mt-2 text-center">
              <span class="text-xs text-gray-400">
                Last updated {{ organization.updatedAt | date:'medium' }}
              </span>
            </div>
          </div>
        </div>

        

            <!-- About Section -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 class="text-lg font-bold text-gray-900 mb-4">Vendor Profile</h2>
              <div class="prose max-w-none text-gray-600">
                <p>Official vendor information and active job postings.</p>
              </div>
            </div>
  `,
  styles: [
    `
      ::ng-deep .status-select-panel {
        margin-top: 8px;
        border-radius: 12px;
        background: white !important;
        border: 1px solid #e5e7eb;
        box-shadow:
          0 10px 25px -5px rgba(0, 0, 0, 0.1),
          0 8px 10px -6px rgba(0, 0, 0, 0.1);
      }

      ::ng-deep .status-select-panel .mat-mdc-option {
        background-color: white !important;
      }

      ::ng-deep .status-option {
        padding: 12px 16px !important;
        transition: all 0.2s ease;
        background-color: white !important;
      }

      ::ng-deep .status-option:hover {
        background-color: #f9fafb !important;
      }

      ::ng-deep .status-option.mdc-list-item--selected {
        background-color: #f3f4f6 !important;
      }

      ::ng-deep .mat-mdc-select-value {
        font-weight: 500;
        color: #374151;
      }

      ::ng-deep .mat-mdc-select-arrow {
        color: #6366f1;
      }
    `,
  ],
})
export class VendorDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  organizationService = inject(OrganizationService);
  headerService = inject(HeaderService);
  authStore = inject(AuthStore); // For permission check
  dialog = inject(MatDialog);
  dialogService = inject(DialogService);
  authService = inject(AuthService);

  vendor = signal<any>(null);
  dashboardStats = signal<DashboardStatsResponse | null>(null);

  // Public View State
  jobs = signal<Job[]>([]);

  // Filter & Pagination State
  searchQuery = signal('');
  sortOrder = signal('newest');
  currentPage = signal(1);
  pageSize = 5;
  currentYear = new Date().getFullYear();

  // Access restrictions
  canEdit = computed(() => {
    const role = this.authStore.userRole();
    // Allow SUPER_ADMIN or HR_ADMIN to edit vendor details
    return role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
  });

  canAction = computed(() => {
    const role = this.authStore.userRole();
    return role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
  });

  canUpdateStatus = computed(() => {
    const role = this.authStore.userRole();
    // Only SUPER_ADMIN can update status
    return role === 'SUPER_ADMIN';
  });

  ngOnInit() {
    this.headerService.setTitle('Vendor Details', 'View organization profile', 'bi bi-shop');

    // Check if ID is present
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadVendor(id);
    }
  }

  loadVendor(id: string) {
    this.organizationService.getOrganizationById(id).subscribe({
      next: (data) => {
        this.vendor.set(data);

        // Fetch Stats
        this.organizationService.getDashboardStats(id).subscribe({
          next: stats => this.dashboardStats.set(stats),
          error: err => console.error('Failed to load dashboard stats', err)
        });

        // Fetch Public Jobs
        this.jobs.set([]);
      },
      error: () => {
        console.error('Failed to load vendor');
      },
    });
  }


  // approve/reject removed as per simplified VendorStatus

  updateStatus(newStatus: string) {
    const v = this.vendor();
    if (v && v.status !== newStatus) {
      const confirmMsg = `Change organization status from ${v.status} to ${newStatus}?`;
      if (confirm(confirmMsg)) {
        this.organizationService.updateStatus(v.id, newStatus).subscribe({
          next: () => {
            this.loadVendor(String(v.id));
          },
          error: (err: any) => {
            console.error('Failed to update status:', err);
            alert('Failed to update status. Please try again.');
          },
        });
      }
    }
  }
}
