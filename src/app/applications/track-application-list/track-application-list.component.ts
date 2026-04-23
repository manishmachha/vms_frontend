import { Component, OnInit, inject, signal, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MfeNavigationService } from '../../services/mfe-navigation.service';
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
  templateUrl: './track-application-list.component.html',
  styleUrls: ['./track-application-list.component.css'],
})
export class TrackApplicationListComponent implements OnInit, AfterViewInit {
  private appService = inject(ApplicationService);
  private headerService = inject(HeaderService);
  private notificationService = inject(NotificationService);
  private mfeNav = inject(MfeNavigationService);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

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
