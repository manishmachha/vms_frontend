import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MfeNavigationService } from '../../services/mfe-navigation.service';
import { JobService } from '../../services/job.service';
import { Job } from '../../models/job.model';
import { HeaderService } from '../../services/header.service';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApplicationFormComponent } from '../../applications/application-form/application-form.component';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';
import { AuthStore } from '../../services/auth.store';
import { NotificationService } from '../../services/notification.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatDialogModule, OrganizationLogoComponent, MatPaginatorModule],
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css'],
})
export class JobListComponent implements OnInit {
  jobService = inject(JobService);
  headerService = inject(HeaderService);
  dialog = inject(MatDialog);
  authStore = inject(AuthStore);
  private notificationService = inject(NotificationService);
  private mfeNav = inject(MfeNavigationService);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  jobs = signal<Job[]>([]);
  filteredJobs = signal<Job[]>([]);
  unreadJobIds = new Set<string>();

  searchQuery = '';
  statusFilter = '';
  employmentTypeFilter = '';
  sortField = 'createdAt,desc';
  availableEmploymentTypes = signal<string[]>(['FTE', 'C2H']);

  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 12;

  ngOnInit() {
    this.headerService.setTitle(
      'Job Board',
      'Explore and apply to opportunities',
      'bi bi-briefcase',
    );
    this.loadUnreadJobIds();
    this.loadJobs();
  }

  loadUnreadJobIds() {
    this.notificationService.getUnreadEntityIds('JOB').subscribe({
      next: (ids) => (this.unreadJobIds = new Set(ids.map(String))),
      error: () => (this.unreadJobIds = new Set()),
    });
  }

  hasNotification(jobId: string | number): boolean {
    return this.unreadJobIds.has(String(jobId));
  }

  loadJobs(page: number = 0) {
    const jobObservable = this.authStore.orgType() === 'VENDOR' 
      ? this.jobService.getPublishedJobs(page, this.pageSize, this.searchQuery || undefined, this.employmentTypeFilter || undefined, this.sortField) 
      : this.jobService.getJobs(page, this.pageSize, this.searchQuery || undefined, this.statusFilter || undefined, this.employmentTypeFilter || undefined, this.sortField);

    jobObservable.subscribe((data) => {
      const jobsList = data.content || [];
      const sorted = [...jobsList].sort((a, b) => {
        const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
        const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
        if (bHasNotif !== aHasNotif) return bHasNotif - aHasNotif;
        return 0;
      });

      this.jobs.set(sorted);
      this.filteredJobs.set(sorted);
      this.totalElements = data.totalElements;
      this.totalPages = data.totalPages;
      this.currentPage = data.number;
    });
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.loadJobs(page);
    }
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.loadJobs(event.pageIndex);
  }

  private searchTimeout: any;
  onSearchChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadJobs(0);
    }, 300);
  }

  applyFilters() {
    this.loadJobs(0);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'SUBMITTED':
        return 'bg-gray-100 text-gray-800';
      case 'VENDOR_SUBMITTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'ADMIN_VERIFIED':
        return 'bg-blue-100 text-blue-800';
      case 'TA_ENRICHED':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN_FINAL_VERIFIED':
        return 'bg-cyan-100 text-cyan-800';
      case 'PAUSED':
        return 'bg-orange-100 text-orange-800';
      case 'CLOSED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  openApplyDialog(job: Job) {
    this.dialog.open(ApplicationFormComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { job },
    });
  }
}
