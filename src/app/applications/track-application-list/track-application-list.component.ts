import { Component, OnInit, inject, signal, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

import { ApplicationService } from '../../services/application.service';
import { NotificationService } from '../../services/notification.service';
import { HeaderService } from '../../services/header.service';
import { JobApplication, ApplicationStatus } from '../../models/application.model';
import { MatTableDataSource } from '@angular/material/table';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';

@Component({
  selector: 'app-track-application-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    FormsModule,
    OrganizationLogoComponent,
  ],
  template: `
    <div class="md:p-8 p-4 mx-auto space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Track Applications</h1>
          <p class="text-gray-500 mt-1">Monitor the status of your outbound applications</p>
        </div>
      </div>

      <!-- Main Content Card -->
      <div class="card-modern overflow-hidden">
        <!-- Search & Filter Toolbar -->
        <div class="p-5 border-b border-gray-100 bg-gray-50/50">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <!-- Search Input -->
            <div class="md:col-span-5 relative group">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <mat-icon class="text-gray-400 group-focus-within:text-indigo-500 transition-colors"
                  >search</mat-icon
                >
              </div>
              <input
                type="text"
                [(ngModel)]="searchText"
                (ngModelChange)="applyFilter()"
                placeholder="Search by role, company or applicant..."
                class="input-modern pl-11! py-2.5! bg-white shadow-sm w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <!-- Status Filter -->
            <div class="md:col-span-4 relative">
              <select
                [(ngModel)]="statusFilter"
                (ngModelChange)="applyFilter()"
                class="input-modern w-full pl-4 pr-10 py-2.5! rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm cursor-pointer appearance-none"
              >
                <option value="">All Statuses</option>
                <option *ngFor="let status of statuses" [value]="status">
                  {{ formatStatus(status) }}
                </option>
              </select>
              <i
                class="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              ></i>
            </div>

            <!-- Reset -->
            <div class="md:col-span-3 flex justify-end">
              <button
                mat-button
                color="warn"
                (click)="clearFilters()"
                class="!bg-red-50 hover:!bg-red-100 !text-red-600 !rounded-lg transition-colors"
                *ngIf="searchText || statusFilter"
              >
                <mat-icon class="mr-1">filter_list_off</mat-icon>
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <!-- DATA VIEW (CARD GRID) -->
        <div class="bg-gray-50/30 p-6">
          <div
            *ngIf="dataSource.filteredData.length > 0"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <div
              *ngFor="let app of dataSource.connect() | async"
              class="card-modern bg-white p-5 flex flex-col gap-5 relative group hover:border-indigo-100 transition-all border border-gray-100 shadow-sm"
              [ngClass]="hasNotification(app.id) ? 'ring-2 ring-red-100/50 border-red-200' : ''"
              [routerLink]="['/applications', app.id]"
            >
              <!-- Notification Indicator -->
              <div *ngIf="hasNotification(app.id)" class="absolute top-4 right-4 z-10">
                <span class="flex h-3 w-3">
                  <span
                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
                  ></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </div>

              <!-- Job & Company -->
              <div class="flex items-start gap-4">
                <app-organization-logo
                  [org]="app.job.organization"
                  size="sm"
                  [rounded]="true"
                  class="shrink-0"
                ></app-organization-logo>
                <div class="min-w-0">
                  <h3
                    class="font-bold text-gray-900 leading-tight truncate group-hover:text-indigo-600 transition-colors"
                  >
                    {{ app.job.title }}
                  </h3>
                  <div class="flex items-center gap-1.5 mt-1">
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                      >#{{ app.job.id }}</span
                    >
                    <span class="text-gray-300">•</span>
                    <span class="text-xs font-medium text-gray-500 truncate">{{
                      app.job.organization?.name || 'Unknown'
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Applicant Details -->
              <div class="bg-gray-50/50 rounded-2xl p-4 space-y-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-indigo-500 shadow-sm"
                  >
                    <i class="bi bi-person"></i>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                      Applicant
                    </p>
                    <p class="text-sm font-bold text-gray-900 truncate">
                      {{ app.candidate?.firstName }} {{ app.candidate?.lastName }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm"
                  >
                    <i class="bi bi-envelope"></i>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                      Email address
                    </p>
                    <p class="text-xs font-medium text-gray-500 truncate">
                      {{ app.candidate?.email }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Status & Date -->
              <div class="flex items-center justify-between gap-2 mt-auto">
                <div class="flex flex-col">
                  <span class="text-[9px] font-bold text-gray-400 uppercase tracking-tight mb-1"
                    >Applied On</span
                  >
                  <div class="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                    <i class="bi bi-calendar3 text-gray-400"></i>
                    {{ app.createdAt | date: 'mediumDate' }}
                  </div>
                </div>
                <span
                  [class]="
                    getStatusClass(app.status) +
                    ' px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border'
                  "
                >
                  {{ formatStatus(app.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Empty State (No results) -->
          <div
            *ngIf="dataSource.filteredData.length === 0"
            class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200"
          >
            <div class="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
              <mat-icon class="text-gray-300">search_off</mat-icon>
            </div>
            <h3 class="text-lg font-bold text-gray-900">No applications found</h3>
            <p class="text-sm text-gray-500 mt-1 max-w-[240px] text-center">
              Try adjusting your search or filters to see more applications.
            </p>
          </div>
        </div>

        <mat-paginator
          [pageSize]="20"
          [pageSizeOptions]="[10, 20, 50, 100]"
          class="border-t border-gray-100"
        ></mat-paginator>
      </div>
    </div>
  `,
})
export class TrackApplicationListComponent implements OnInit, AfterViewInit {
  private appService = inject(ApplicationService);
  private headerService = inject(HeaderService);
  private notificationService = inject(NotificationService);

  // View Children
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // State
  dataSource = new MatTableDataSource<JobApplication>([]);
  unreadAppIds = new Set<string>();

  // Filters
  searchText = '';
  statusFilter: ApplicationStatus | '' = '';

  displayedColumns = [];

  statuses: ApplicationStatus[] = [
    'APPLIED',
    'SHORTLISTED',
    'INTERVIEW_SCHEDULED',
    'INTERVIEW_PASSED',
    'INTERVIEW_FAILED',
    'OFFERED',
    'ONBOARDING_IN_PROGRESS',
    'ONBOARDED',
    'REJECTED',
    'DROPPED',
  ];

  ngOnInit() {
    this.headerService.setTitle(
      'Track Applications',
      'Status of jobs you have applied to',
      'bi bi-cursor',
    );
    this.loadUnreadAppIds();
    this.setupFilterPredicate();
    this.loadApplications();
  }

  loadUnreadAppIds() {
    this.notificationService.getUnreadEntityIds('APPLICATION').subscribe({
      next: (ids) => (this.unreadAppIds = new Set(ids.map(String))),
      error: () => (this.unreadAppIds = new Set()),
    });
  }

  hasNotification(appId: string | number): boolean {
    return this.unreadAppIds.has(String(appId));
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  loadApplications() {
    // Fetch a large page to simulate "All" for client-side ops
    this.appService.getApplications(undefined, 0, 1000, 'OUTBOUND').subscribe({
      next: (page) => {
        // Sort: notified first
        const sorted = [...page.content].sort((a, b) => {
          const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
          const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
          return bHasNotif - aHasNotif;
        });
        this.dataSource.data = sorted;

        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
      },
      error: (error) => console.error(error),
    });
  }

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: JobApplication, filter: string) => {
      const searchTerms = JSON.parse(filter);
      const text = searchTerms.text.toLowerCase();
      const status = searchTerms.status;

      // Check Status
      const matchesStatus = status ? data.status === status : true;

      // Check Text (Job Title, Company, Applicant Name/Email)
      const matchesText =
        !text ||
        data.job.title.toLowerCase().includes(text) ||
        (data.job.organization?.name || '').toLowerCase().includes(text) ||
        (data.candidate?.firstName || '').toLowerCase().includes(text) ||
        (data.candidate?.lastName || '').toLowerCase().includes(text) ||
        (data.candidate?.email || '').toLowerCase().includes(text);

      return matchesStatus && matchesText;
    };
  }

  // setupSorting() was removed as it's no longer needed for the card view.

  applyFilter() {
    const filterValue = JSON.stringify({
      text: this.searchText,
      status: this.statusFilter,
    });
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters() {
    this.searchText = '';
    this.statusFilter = '';
    this.applyFilter();
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'APPLIED':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100/50';
      case 'SHORTLISTED':
        return 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-100/50';
      case 'INTERVIEW_SCHEDULED':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100/50';
      case 'INTERVIEW_PASSED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-100/50';
      case 'INTERVIEW_FAILED':
        return 'bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-100/50';
      case 'OFFERED':
        return 'bg-green-50 text-green-700 border-green-200 ring-1 ring-green-100/50';
      case 'ONBOARDING_IN_PROGRESS':
        return 'bg-teal-50 text-teal-700 border-teal-200 ring-1 ring-teal-100/50';
      case 'ONBOARDED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-1 ring-emerald-200 font-bold';
      case 'REJECTED':
      case 'DROPPED':
        return 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100/50';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }
}
