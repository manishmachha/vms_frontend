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

  // State
  applications = signal<JobApplication[]>([]);
  unreadAppIds = signal<Set<string>>(new Set<string>());
  totalElements = signal(0);
  pageSize = signal(9);
  currentPage = signal(0);

  // Filters
  searchText = signal('');
  statusFilter = signal<ApplicationStatus | ''>('');

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
    this.loadApplications();
  }

  loadUnreadAppIds() {
    this.notificationService.getUnreadEntityIds('APPLICATION').subscribe({
      next: (ids) => this.unreadAppIds.set(new Set(ids.map(String))),
      error: () => this.unreadAppIds.set(new Set()),
    });
  }

  hasNotification(appId: string | number): boolean {
    return this.unreadAppIds().has(String(appId));
  }

  ngAfterViewInit() {
  }

  loadApplications(pageIndex?: number, pageSize?: number) {
    const p = pageIndex ?? this.currentPage();
    const s = pageSize ?? this.pageSize();

    this.appService
      .getApplications(
        undefined,
        p,
        s,
        'OUTBOUND',
        this.searchText() || undefined,
        (this.statusFilter() || undefined) as any
      )
      .subscribe({
        next: (page: any) => {
          this.totalElements.set(page.totalElements || 0);
          this.currentPage.set(page.number || p);
          const sorted = [...(page.content || [])].sort((a, b) => {
            const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
            const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
            return bHasNotif - aHasNotif;
          });
          this.applications.set(sorted);
        },
        error: (error) => console.error(error),
      });
  }

  onPageChange(event: any) {
    this.pageSize.set(event.pageSize);
    this.currentPage.set(event.pageIndex);
    this.loadApplications(event.pageIndex, event.pageSize);
  }

  applyFilter() {
    this.currentPage.set(0);
    this.loadApplications(0, this.pageSize());
  }

  clearFilters() {
    this.searchText.set('');
    this.statusFilter.set('');
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

  onCardClick(appId: string | number) {
    if (this.hasNotification(appId)) {
      this.notificationService.markAsReadByEntity('APPLICATION', appId).subscribe(() => {
        const currentSet = this.unreadAppIds();
        currentSet.delete(String(appId));
        this.unreadAppIds.set(new Set(currentSet));
        this.notificationService.refreshCounts();
      });
    }
  }
}
