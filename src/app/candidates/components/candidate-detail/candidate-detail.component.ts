import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CandidateService } from '../../services/candidate.service';
import { BrandedResumeService } from '../../services/branded-resume.service';
import { BrandedResume } from '../../models/branded-resume.model';
import { Candidate, CandidateExperience } from '../../models/candidate.model'; // Assuming CandidateExperience is exported
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '../../../services/auth.store';
import { JobApplication } from '../../../models/application.model';
import { Interview } from '../../../models/interview.model';
import { MatIconModule } from '@angular/material/icon';
import { HubDashboardBannerComponent } from '../../../shared/components/hub-dashboard-banner/hub-dashboard-banner.component';
import { DashboardStatsResponse } from '../../../models/dashboard-stats.model';

import { OrganizationLogoComponent } from '../../../layout/components/organization-logo/organization-logo.component';
import { ClientSubmissionsComponent } from '../client-submissions/client-submissions.component';
import { DialogService } from '../../../services/dialog.service';
import { HeaderService } from '../../../services/header.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MfeNavigationService } from '../../../services/mfe-navigation.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-candidate-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    OrganizationLogoComponent,
    ClientSubmissionsComponent,
    HubDashboardBannerComponent,
    MatIconModule,
    MatTabsModule,
    FormsModule
  ],
  templateUrl: './candidate-detail.component.html',
  styleUrls: ['./candidate-detail.component.css'],
})

export class CandidateDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mfeNav = inject(MfeNavigationService);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }
  private candidateService = inject(CandidateService);
  private snackBar = inject(MatSnackBar);
  private brandedResumeService = inject(BrandedResumeService);
  public authStore = inject(AuthStore);
  private dialogService = inject(DialogService);
  private headerService = inject(HeaderService);
  candidate = signal<Candidate | null>(null);
  dashboardStats = signal<DashboardStatsResponse | null>(null);

  selectedStatus = signal<string>('AVAILABLE');
  brandedResume = signal<BrandedResume | null>(null);
  applications = signal<JobApplication[]>([]);
  interviews = signal<Interview[]>([]);
  skillsExpanded = signal(false);

  readonly candidateStatuses = [
    'ONBOARDING',
    'OFFERED',
    'IN_BILLING',
    'BENCH',
    'NOTICE_PERIOD',
    'PROBATION',
    'ACTIVE',
    'INACTIVE'
  ];


  ngOnInit() {
    this.headerService.setTitle(
      'Candidate Details',
      'Review candidate details',
      'bi bi-person-lines-fill',
    );
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadCandidate(id);
      }
    });
  }

  loadCandidate(id: string) {
    this.candidateService.getCandidate(id).subscribe({
      next: (c) => {
        this.candidate.set(c);
        this.selectedStatus.set(c.status || 'AVAILABLE');

        this.loadApplications(c.id);
        this.loadInterviews(c.id);
        this.loadBrandedResume(c.id);

        // Load dashboard stats
        this.candidateService.getDashboardStats(c.id).subscribe({
          next: stats => {
            if (c.organization && stats?.stats) {
              stats.stats = stats.stats.map(s => {
                if (s.label.toLowerCase().includes('vendor')) {
                  if (!s.items) s.items = [];
                  if (!s.items.find(i => i.id === c.organization!.id)) {
                    s.items = [{ id: c.organization!.id, name: c.organization!.name }, ...s.items];
                  }
                }
                return s;
              });
            }
            this.dashboardStats.set(stats);
          },
          error: err => console.error('Failed to load dashboard stats', err)
        });
      },
      error: (err) => console.error('Failed to load candidate', err),
    });
  }



  loadApplications(id: string) {
    this.candidateService.getCandidateApplications(id).subscribe({
      next: (apps) => this.applications.set(apps),
      error: (err) => console.error('Failed to load applications', err)
    });
  }

  loadInterviews(id: string) {
    this.candidateService.getCandidateInterviews(id).subscribe({
      next: (ivs) => this.interviews.set(ivs),
      error: (err) => console.error('Failed to load interviews', err)
    });
  }

  loadBrandedResume(candidateId: string) {
    this.brandedResumeService.getLatest(candidateId).subscribe({
      next: (br) => this.brandedResume.set(br),
      error: () => this.brandedResume.set(null),
    });
  }

  downloadBrandedResume() {
    const br = this.brandedResume();
    if (!br) return;
    this.brandedResumeService.download(br.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = br.originalFileName || 'branded-resume.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Download failed', 'Close', { duration: 3000 }),
    });
  }

  regenerateBrandedResume() {
    const c = this.candidate();
    if (!c) return;
    this.brandedResumeService.regenerate(c.id).subscribe({
      next: () => {
        this.snackBar.open('Branded resume generation started!', 'OK', { duration: 3000 });
        setTimeout(() => this.loadBrandedResume(c.id), 10000);
      },
      error: () => this.snackBar.open('Regeneration failed', 'Close', { duration: 3000 }),
    });
  }


  openArchiveConfirm() {
    this.dialogService.confirm('Archive Candidate', 'Are you sure you want to archive this candidate?', 'primary').subscribe(confirmed => {
      if (confirmed) {
        const c = this.candidate();
        if (!c) return;
        this.candidateService.archiveCandidate(c.id).subscribe({
          next: (updated) => {
            this.candidate.set(updated);
            this.snackBar.open('Candidate archived successfully', 'OK', { duration: 3000 });
          },
          error: () => this.snackBar.open('Archive failed', 'Close', { duration: 3000 })
        });
      }
    });
  }

  updateStatus(status: string) {
    const c = this.candidate();
    if (c) {
      this.candidateService.updateStatus(c.id, status).subscribe({
        next: (updated: Candidate) => {
          this.candidate.set(updated);
          this.selectedStatus.set(updated.status || 'AVAILABLE');
          this.snackBar.open('Status updated successfully', 'OK', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to update status', 'Close', { duration: 3000 })
      });
    }
  }

  openDeleteConfirm() {
    this.dialogService.confirmDelete('Candidate').subscribe(confirmed => {
      if (confirmed) {
        const c = this.candidate();
        if (!c) return;
        this.candidateService.deleteCandidate(c.id).subscribe({
          next: () => {
            this.snackBar.open('Candidate deleted', 'OK', { duration: 3000 });
            this.mfeNav.navigate('/candidates');
          },
          error: () => this.snackBar.open('Delete failed', 'Close', { duration: 3000 })
        });
      }
    });
  }

  // Removed manual updateChart() as computed handles it properly now.

  getInitials(c: Candidate): string {
    return (c.firstName[0] + (c.lastName ? c.lastName[0] : '')).toUpperCase();
  }

  getExperience(): any[] {
    try {
      if (this.candidate()?.experienceDetailsJson) {
        return JSON.parse(this.candidate()!.experienceDetailsJson!);
      }
    } catch (e) { }
    return [];
  }

  getEducation(): any[] {
    try {
      if (this.candidate()?.educationDetailsJson) {
        return JSON.parse(this.candidate()!.educationDetailsJson!);
      }
    } catch (e) { }
    return [];
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    const c = this.candidate();
    if (file && c) {
      this.candidateService.updateResume(c.id, file).subscribe({
        next: (updated) => {
          this.candidate.set(updated);
          this.snackBar.open('Resume updated and profile refreshed!', 'OK', { duration: 3000 });
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Failed to update resume', 'Close', { duration: 3000 });
        },
      });
    }
  }

  downloadResume() {
    const c = this.candidate();
    if (!c || !c.resumeFilePath) return;

    this.candidateService.downloadResume(c.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        let filename = c.resumeOriginalFileName;
        if ((!filename || filename === 'null') && blob.type === 'application/pdf') {
          filename = 'resume.pdf';
        } else if (!filename) {
          filename = 'resume';
        }

        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Download failed', err);
        this.snackBar.open('Failed to download resume', 'Close', { duration: 3000 });
      },
    });
  }
}
