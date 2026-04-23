import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JobService } from '../../services/job.service';
import { Job, JobStatus } from '../../models/job.model';
import { AuthStore } from '../../services/auth.store';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ApplicationService } from '../../services/application.service';
import { Candidate } from '../../candidates/models/candidate.model';
import { TimelineComponent } from '../../layout/components/timeline/timeline.component';
import { ApplicationFormComponent } from '../../applications/application-form/application-form.component';
import { MatDialog } from '@angular/material/dialog';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';
import { HeaderService } from '../../services/header.service';
import { JobApplication } from '../../models/application.model';
import { DialogService } from '../../services/dialog.service';
import { JobEnrichDialogComponent } from '../dialogs/job-enrich-dialog/job-enrich-dialog.component';
import { JobVerifyDialogComponent } from '../dialogs/job-verify-dialog/job-verify-dialog.component';
import { JobStatusDialogComponent } from '../dialogs/job-status-dialog/job-status-dialog.component';
import { TimelineService, TimelineEvent } from '../../services/timeline.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MfeNavigationService } from '../../services/mfe-navigation.service';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    FormsModule,
    TimelineComponent,
    OrganizationLogoComponent,
    MatTabsModule,
    MatIconModule
  ],
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.css'],
})
export class JobDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  private mfeNav = inject(MfeNavigationService);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }
  jobService = inject(JobService);
  authStore = inject(AuthStore);
  fb = inject(FormBuilder);
  applicationService = inject(ApplicationService);
  dialog = inject(MatDialog);
  headerService = inject(HeaderService);
  dialogService = inject(DialogService);
  timelineService = inject(TimelineService);

  job = signal<Job | null>(null);
  timelineEvents = signal<TimelineEvent[]>([]);
  myCandidates = signal<Candidate[]>([]);
  selectedCandidateId = '';
  applications = signal<JobApplication[]>([]);
  groupedApplications = computed(() => {
    const apps = this.applications();
    const groups = new Map<string, JobApplication[]>();
    apps.forEach((app) => {
      const vendorName = app.vendor?.name || 'In-house / Direct';
      if (!groups.has(vendorName)) groups.set(vendorName, []);
      groups.get(vendorName)!.push(app);
    });
    return Array.from(groups.entries());
  });

  ngOnInit() {
    this.headerService.setTitle('Job Details', 'View job details', 'bi bi-briefcase');
    this.loadJob();
  }

  loadJob() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.jobService.getJob(id).subscribe((data) => {
        this.job.set(data);
      });
      this.applicationService.getApplications(id).subscribe((res) => {
        this.applications.set(res.content);
      });
      this.loadTimeline(id);
    }
  }

  loadTimeline(id: string) {
    this.timelineService.getTimeline('JOB', id).subscribe({
      next: (res) => this.timelineEvents.set(res.content),
      error: (err) => console.error('Failed to load timeline', err),
    });
  }

  // Permission Checks - Allow all Solventek admins/TA (non-employee) for basic management
  canManage() {
    return !this.authStore.isEmployee() && this.authStore.orgType() === 'SOLVENTEK';
  }

  // Critical actions restricted to Super Admin and HR Admin (No TA)
  canPerformCriticalAction() {
    return this.canManage() && !this.authStore.isTA();
  }

  canVerify() {
    return (
      this.canPerformCriticalAction() &&
      (this.job()?.status === 'SUBMITTED' || this.job()?.status === 'DRAFT')
    );
  }
  canEnrich() {
    return (
      this.canManage() && // TA can enrich
      this.job()?.status === 'ADMIN_VERIFIED'
    );
  }
  canFinalVerify() {
    return (
      this.canPerformCriticalAction() && // TA cannot final verify/approve
      (this.job()?.status === 'TA_ENRICHED' || this.job()?.status === 'ADMIN_VERIFIED')
    );
  }
  canPublish() {
    return (
      this.canPerformCriticalAction() && // TA cannot publish
      this.job()?.status === 'ADMIN_FINAL_VERIFIED'
    );
  }

  // Formatters
  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  formatEmploymentType(type: string | undefined): string {
    if (!type) return 'N/A';
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getSkillCount(): number {
    return this.job()?.skills?.split(',').length || 0;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'ADMIN_VERIFIED':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'TA_ENRICHED':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'ADMIN_FINAL_VERIFIED':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'CLOSED':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'bi-globe';
      case 'DRAFT':
        return 'bi-file-earmark';
      case 'SUBMITTED':
        return 'bi-send';
      case 'ADMIN_VERIFIED':
        return 'bi-check-circle';
      case 'TA_ENRICHED':
        return 'bi-stars';
      case 'ADMIN_FINAL_VERIFIED':
        return 'bi-shield-check';
      case 'CLOSED':
        return 'bi-x-circle';
      default:
        return 'bi-circle';
    }
  }

  openApplyDialog(job: Job) {
    this.dialog.open(ApplicationFormComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { job },
    });
  }

  // Actions
  verify() {
    const currentJob = this.job();
    if (!currentJob) return;

    this.dialogService.confirm(
      'Verify Job',
      'Are you sure you want to verify this job? It will be move to enrichment stage.',
      'primary'
    ).subscribe(confirmed => {
      if (confirmed) {
        this.jobService.verifyJob(currentJob.id).subscribe(() => this.loadJob());
      }
    });
  }

  openEnrichForm() {
    const currentJob = this.job();
    if (!currentJob) return;

    this.dialog.open(JobEnrichDialogComponent, {
      width: '800px',
      data: { job: currentJob },
      panelClass: 'dialog-modern'
    }).afterClosed().subscribe(result => {
      if (result) this.loadJob();
    });
  }

  onFinalVerify() {
    const currentJob = this.job();
    if (!currentJob) return;

    this.dialog.open(JobVerifyDialogComponent, {
      width: '500px',
      data: { job: currentJob },
      panelClass: 'dialog-modern'
    }).afterClosed().subscribe(result => {
      if (result) this.loadJob();
    });
  }

  publish() {
    const currentJob = this.job();
    if (!currentJob) return;

    this.dialogService.confirm(
      'Publish Job',
      'Are you sure you want to publish this job? It will be visible to vendors and candidates.',
      'success'
    ).subscribe(confirmed => {
      if (confirmed) {
        this.jobService.publishJob(currentJob.id).subscribe(() => this.loadJob());
      }
    });
  }

  deleteJob() {
    this.dialogService.confirmDelete('Job').subscribe(confirmed => {
      if (confirmed && this.job()) {
        this.jobService.deleteJob(this.job()!.id).subscribe(() => {
          this.mfeNav.navigate('/jobs');
        });
      }
    });
  }

  onUpdateStatus() {
    const currentJob = this.job();
    if (!currentJob) return;

    this.dialog.open(JobStatusDialogComponent, {
      width: '500px',
      data: { job: currentJob },
      panelClass: 'dialog-modern'
    }).afterClosed().subscribe(result => {
      if (result) this.loadJob();
    });
  }
}
