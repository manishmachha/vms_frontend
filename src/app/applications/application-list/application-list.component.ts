import { ChangeDetectorRef, Component, inject, ViewChild, AfterViewInit, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApplicationService } from '../../services/application.service';
import { JobApplication } from '../../models/application.model';
import { NotificationService } from '../../services/notification.service';
import { HeaderService } from '../../services/header.service';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FormsModule,
    OrganizationLogoComponent,
  ],
  templateUrl: './application-list.component.html',
})
export class ApplicationListComponent implements OnInit, AfterViewInit {
  private headerService = inject(HeaderService);
  private appService = inject(ApplicationService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  dataSource = new MatTableDataSource<JobApplication>([]);
  unreadAppIds = new Set<string>();
  totalElements = 0;

  filterValues = {
    searchTerm: '',
    minRisk: null as number | null,
    maxRisk: null as number | null,
    minMatch: null as number | null,
    maxMatch: null as number | null,
    status: '' as string,
  };

  isMobile = signal(false);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {}

  ngOnInit() {
    this.headerService.setTitle(
      'Applications',
      'Manage job applications and recruitment pipeline',
      'bi bi-file-earmark-person',
    );
    this.loadUnreadAppIds();
    this.loadApplications();

    this.dataSource.filterPredicate = (data: JobApplication, filter: string): boolean => {
      // 1. Text Search
      const search = this.filterValues.searchTerm.toLowerCase();
      const name = ((data.candidate?.firstName || '') + ' ' + (data.candidate?.lastName || '')).toLowerCase();
      const matchesSearch =
        !search ||
        name.includes(search) ||
        (data.candidate?.email?.toLowerCase().includes(search) ?? false) ||
        (data.candidate?.currentCompany?.toLowerCase().includes(search) ?? false) ||
        (data.job?.requestId?.toLowerCase().includes(search) ?? false) ||
        (data.job?.title?.toLowerCase().includes(search) ?? false) ||
        data.status.toLowerCase().includes(search);

      // 2. Risk & Consistency Filters
      const analysis = (data as any)['latestAnalysis'];

      if (this.filterValues.minRisk != null) {
        if (!analysis || (analysis.overallRiskScore ?? 0) < this.filterValues.minRisk) return false;
      }
      if (this.filterValues.maxRisk != null) {
        if (!analysis || (analysis.overallRiskScore ?? 0) > this.filterValues.maxRisk) return false;
      }

      if (this.filterValues.minMatch != null) {
        if (!analysis || (analysis.jobMatchScore ?? 0) < this.filterValues.minMatch)
          return false;
      }
      if (this.filterValues.maxMatch != null) {
        if (!analysis || (analysis.jobMatchScore ?? 0) > this.filterValues.maxMatch)
          return false;
      }

      return matchesSearch;
    };
  }

  loadUnreadAppIds() {
    this.notificationService.getUnreadEntityIds('APPLICATION').subscribe({
      next: (ids: (string | number)[]) => (this.unreadAppIds = new Set(ids.map(String))),
      error: () => (this.unreadAppIds = new Set()),
    });
  }

  hasNotification(appId: string | number): boolean {
    return this.unreadAppIds.has(String(appId));
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  loadApplications(pageIndex?: number, pageSize?: number) {
    const p = pageIndex ?? this.paginator?.pageIndex ?? 0;
    const s = pageSize ?? this.paginator?.pageSize ?? 9;

    this.appService
      .getApplications(
        undefined,
        p,
        s,
        'INBOUND',
        this.filterValues.searchTerm,
        this.filterValues.status as any,
      )
      .subscribe((page: any) => {
        setTimeout(() => {
          this.totalElements = page.totalElements || 0;
          this.cdr.detectChanges();
        });
        
        // If empty, just set and return
        if (!page.content || page.content.length === 0) {
          this.dataSource.data = [];
          return;
        }

        // Enrichment logic
        const analysisRequests = page.content.map((app: any) =>
          this.appService.getLatestAnalysis(app.id).pipe(
            map((res) => ({ appId: app.id, analysis: res })),
            catchError(() => of({ appId: app.id, analysis: null })),
          ),
        );

        forkJoin<any[]>(analysisRequests).subscribe((results) => {
          const enrichedApps = page.content.map((app: any) => {
            const res = results.find((r: any) => r.appId === app.id);
            if (res && res.analysis) {
              app.latestAnalysis = res.analysis;
            }
            return app;
          });

          // Client-side filtering as fallback/analytical filter
          const filtered = enrichedApps.filter((app: any) => {
            // 1. Risk/Match Filters (Analytical - requires enrichment)
            const analysis = app.latestAnalysis;
            const risk = analysis?.overallRiskScore ?? 0;
            const match = analysis?.jobMatchScore ?? 0;

            if (this.filterValues.maxRisk != null && risk > this.filterValues.maxRisk)
              return false;
            if (this.filterValues.minMatch != null && match < this.filterValues.minMatch)
              return false;

            // 2. Status Fallback (if server-side didn't handle it)
            if (
              this.filterValues.status &&
              app.status.toLowerCase() !== this.filterValues.status.toLowerCase()
            )
              return false;

            return true;
          });

          // Sort: notified apps first
          const sorted = [...filtered].sort((a, b) => {
            const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
            const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
            return bHasNotif - aHasNotif;
          });

          this.dataSource.data = sorted;
          this.cdr.detectChanges();
        });
      });
  }

  onPageChange(event: any) {
    this.loadApplications(event.pageIndex, event.pageSize);
  }

  applyFilter() {
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadApplications();
  }

  viewDetails(app: JobApplication) {
    this.router.navigate(['/applications', app.id]);
  }

  getStatusClasses(status: string): string {
    const baseClasses = 'badge';
    switch (status) {
      case 'APPLIED':
        return `${baseClasses} badge-primary`; // Indigo
      case 'SHORTLISTED':
        return `${baseClasses} badge-primary`;
      case 'INTERVIEW_SCHEDULED':
        return `${baseClasses} badge-warning`; // Warning/Orange/Gold
      case 'OFFERED':
        return `${baseClasses} badge-success`; // Emerald
      case 'ONBOARDED':
        return `${baseClasses} badge-success`;
      case 'REJECTED':
        return `${baseClasses} badge-danger`; // Red
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  }

  getRiskColorClass(score: number | undefined, isBg: boolean = false): string {
    if (score === undefined) return isBg ? 'bg-gray-500' : 'text-gray-700';

    // High score = High Risk (Red)
    if (score > 70) return isBg ? 'bg-red-500' : 'text-red-600';
    // Medium score = Medium Risk (Orange)
    if (score > 40) return isBg ? 'bg-orange-500' : 'text-orange-600';
    // Low score = Low Risk (Green)
    return isBg ? 'bg-green-500' : 'text-green-600';
  }
}
