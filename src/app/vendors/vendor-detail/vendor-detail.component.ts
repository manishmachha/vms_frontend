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
  templateUrl: './vendor-detail.component.html',
  styleUrls: ['./vendor-detail.component.css'],
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
    return role === 'SUPER_ADMIN' || role === 'MANAGER';
  });

  canAction = computed(() => {
    const role = this.authStore.userRole();
    return role === 'SUPER_ADMIN' || role === 'MANAGER';
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
          next: (stats) => this.dashboardStats.set(stats),
          error: (err) => console.error('Failed to load dashboard stats', err),
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
