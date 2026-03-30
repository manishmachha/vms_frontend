import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { VendorService } from '../../services/vendor.service';
import { Vendor } from '../../models/vendor.model';
import { Organization } from '../../models/auth.model';
import { HeaderService } from '../../services/header.service';
import { AuthStore } from '../../services/auth.store';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';
import { OrganizationService } from '../../services/organization.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Job } from '../../models/job.model';
import { DialogService } from '../../services/dialog.service';
import { AuthService } from '../../services/auth.service';

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
    RouterLink,
  ],
  template: `
    <div class=" mx-auto space-y-8 p-6">
      <div *ngIf="loading()" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <ng-container *ngIf="vendor() as organization">
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
              <span class="badge badge-primary">{{ organization.type }}</span>
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

        <!-- Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- LEFT COLUMN: Jobs (Public) or details -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Public Job Listings -->
            <div *ngIf="jobs().length > 0 || searchQuery()" class="space-y-4">
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-bold text-gray-900">
                  Open Opportunities
                  <span
                    class="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full ml-2"
                    >{{ filteredJobs().length }}</span
                  >
                </h2>
                <!-- Simple Sort/Search could go here -->
              </div>

              <!-- Toolbar -->
              <div
                class="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm"
              >
                <div class="relative flex-1">
                  <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
                    >search</mat-icon
                  >
                  <input
                    type="text"
                    [ngModel]="searchQuery()"
                    (ngModelChange)="onSearchChange($event)"
                    placeholder="Search jobs..."
                    class="w-full pl-9 pr-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <select
                  [ngModel]="sortOrder()"
                  (ngModelChange)="onSortChange($event)"
                  class="bg-gray-50 border-0 rounded-lg text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              <div class="space-y-3">
                <div
                  *ngFor="let job of paginatedJobs()"
                  [routerLink]="['/jobs', job.id]"
                  class="bg-white p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <h3
                        class="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors"
                      >
                        {{ job.title }}
                      </h3>
                      <div class="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span class="flex items-center gap-1"
                          ><mat-icon class="text-sm align-middle">work_outline</mat-icon>
                          {{ job.employmentType }}</span
                        >
                      </div>
                    </div>
                    <span class="badge" [ngClass]="getJobTypeBadge(job.employmentType)">{{
                      job.employmentType
                    }}</span>
                  </div>
                  <p class="text-gray-500 text-sm mt-3 line-clamp-2">{{ job.description }}</p>
                </div>
              </div>
              <!-- Pagination -->
              <div *ngIf="totalPages() > 1" class="flex justify-center gap-2 mt-4">
                <button
                  (click)="setPage(currentPage() - 1)"
                  [disabled]="currentPage() === 1"
                  class="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                >
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <span class="py-2 px-4 text-sm font-medium"
                  >Page {{ currentPage() }} of {{ totalPages() }}</span
                >
                <button
                  (click)="setPage(currentPage() + 1)"
                  [disabled]="currentPage() === totalPages()"
                  class="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                >
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
            </div>

            <!-- About Section -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 class="text-lg font-bold text-gray-900 mb-4">Vendor Profile</h2>
              <div class="prose max-w-none text-gray-600">
                <p>Official vendor information and active job postings.</p>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Contact & Business Details -->
          <div class="space-y-6">


            <!-- Note: Re-using the lower contact card for completeness, even if duplicated in header, as it has grouping -->
          </div>
        </div>
      </ng-container>
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
  vendorService = inject(VendorService);
  organizationService = inject(OrganizationService);
  headerService = inject(HeaderService);
  authStore = inject(AuthStore); // For permission check
  dialog = inject(MatDialog);
  dialogService = inject(DialogService);
  authService = inject(AuthService);

  vendor = signal<any>(null);
  loading = signal(true);

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
    } else {
      this.loading.set(false);
    }
  }

  loadVendor(id: string) {
    this.loading.set(true);

    // User state managed by AuthStore

    this.vendorService.getVendorById(id).subscribe({
      next: (data) => {
        this.vendor.set(data);

        // Fetch Public Jobs
        // (getPublicJobs removed - not in organization service)
        this.jobs.set([]);

        this.loading.set(false);
      },
      error: () => {
        console.error('Failed to load vendor');
        this.loading.set(false);
      },
    });
  }


  // approve/reject removed as per simplified VendorStatus

  updateStatus(newStatus: string) {
    const v = this.vendor();
    if (v && v.status !== newStatus) {
      const confirmMsg = `Change organization status from ${v.status} to ${newStatus}?`;
      if (confirm(confirmMsg)) {
        this.vendorService.updateVendorStatus(v.id, newStatus).subscribe({
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

  // --- Job Listing Logic ---

  filteredJobs = computed(() => {
    let result = [...this.jobs()];
    const query = this.searchQuery();
    const sort = this.sortOrder();

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (j) => (j.title?.toLowerCase().includes(q) || (j.description || '').toLowerCase().includes(q)),
      );
    }

    result.sort((a, b) => {
      switch (sort) {
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'oldest':
          return (a.createdAt || '').localeCompare(b.createdAt || '');
        case 'newest':
        default:
          return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
    });

    return result;
  });

  paginatedJobs = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredJobs().slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.filteredJobs().length / this.pageSize));

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  onSortChange(value: string) {
    this.sortOrder.set(value);
    this.currentPage.set(1);
  }

  resetFilters() {
    this.searchQuery.set('');
    this.sortOrder.set('newest');
    this.currentPage.set(1);
  }

  getJobTypeBadge(type?: string): string {
    switch (type) {
      case 'FULL_TIME':
        return 'badge-success';
      case 'CONTRACT':
        return 'badge-warning';
      case 'PART_TIME':
        return 'badge-info';
      default:
        return 'badge-primary';
    }
  }
}
