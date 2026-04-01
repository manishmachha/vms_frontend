import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin, of, Subscription, interval } from 'rxjs';
import { startWith, switchMap, map, catchError } from 'rxjs/operators';

import { ApplicationService } from '../../services/application.service';
import { DialogService } from '../../services/dialog.service';
import { HeaderService } from '../../services/header.service';
import { BrandedResumeService } from '../../candidates/services/branded-resume.service';
import { BrandedResume } from '../../candidates/models/branded-resume.model';
import { JobApplication, ApplicationStatus } from '../../models/application.model';
import { AuthStore } from '../../services/auth.store';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';
import { ClientSubmissionsComponent } from '../../candidates/components/client-submissions/client-submissions.component';
import { InterviewService } from '../../services/interview.service';
import { UserService } from '../../services/user.service';
import { Interview, InterviewType } from '../../models/interview.model';
import { ChangeDetectorRef } from '@angular/core';
import { DashboardStatsResponse } from '../../models/dashboard-stats.model';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
    OrganizationLogoComponent,
    ClientSubmissionsComponent,
  ],
  templateUrl: './application-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private appService = inject(ApplicationService);
  private headerService = inject(HeaderService);
  private dialogService = inject(DialogService);
  private brandedResumeService = inject(BrandedResumeService);
  private authStore = inject(AuthStore);
  private interviewService = inject(InterviewService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  // Permission Signal
  // Permission Signals
  canManageApplication = computed(() => {
    // Super Admin, HR Admin, TA can manage
    return !this.authStore.isEmployee() && !this.authStore.isVendor();
  });

  canDownloadResume = computed(() => {
    // Managers + Vendor (if they own the application)
    const app = this.application();
    const user = this.authStore.user();
    if (!app || !user) return false;

    if (this.canManageApplication()) return true;
    if (this.authStore.isVendor()) {
      return app.candidate?.organization?.id === user.organizationId;
    }
    return false;
  });

  canDownloadDocuments = computed(() => {
    // Only Managers can download internal docs (Offer, etc)
    return this.canManageApplication();
  });

  // State Signals
  application = signal<JobApplication | null>(null);
  dashboardStats = signal<DashboardStatsResponse | null>(null);
  brandedResume = signal<BrandedResume | null>(null);
  analysis = signal<any>(null);
  timeline = signal<any[]>([]);
  documents = signal<any[]>([]);

  isPollingAnalysis = signal(true);

  // Interview State
  interviews = signal<Interview[]>([]);
  showScheduleModal = signal(false);
  potentialCcUsers = signal<any[]>([]);
  userSearchTerm = signal('');

  filteredCcUsers = computed(() => {
    const term = this.userSearchTerm().toLowerCase();
    const users = this.potentialCcUsers();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.firstName?.toLowerCase().includes(term) ||
        u.lastName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.organizationName?.toLowerCase().includes(term),
    );
  });

  scheduleForm = this.fb.group({
    scheduledAt: ['', Validators.required],
    durationMinutes: [30, [Validators.required, Validators.min(15)]],
    type: ['TECHNICAL' as InterviewType, Validators.required],
    meetingLink: [''],
    ccUserIds: [[] as number[]],
    schedulingNotes: [''],
  });

  // Documents
  selectedFile: File | null = null;
  selectedCategory: string = 'Other';
  docCategories = ['Resume', 'Offer Letter', 'Contract', 'ID Proof', 'Other'];

  // Notes
  newNote = '';

  // Analysis Parsing (Derived from analysis signal)
  parsedRedFlags = computed(() => {
    const analysis = this.analysis();
    if (!analysis) return [];
    try {
      if (typeof analysis.redFlagsJson === 'string') {
        return JSON.parse(analysis.redFlagsJson);
      } else if (Array.isArray(analysis.redFlagsJson)) {
        return analysis.redFlagsJson;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  parsedEvidence = computed(() => {
    const analysis = this.analysis();
    if (!analysis) return [];
    try {
      if (typeof analysis.evidenceJson === 'string') {
        return JSON.parse(analysis.evidenceJson);
      } else if (Array.isArray(analysis.evidenceJson)) {
        return analysis.evidenceJson;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  parsedQuestions = computed(() => {
    const analysis = this.analysis();
    if (!analysis) return {};
    try {
      if (typeof analysis.interviewQuestionsJson === 'string') {
        return JSON.parse(analysis.interviewQuestionsJson);
      } else if (typeof analysis.interviewQuestionsJson === 'object') {
        return analysis.interviewQuestionsJson;
      }
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  questionCategories = computed(() => Object.keys(this.parsedQuestions()));

  // Radar Chart
  public radarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { display: false },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        pointLabels: { font: { size: 12, family: "'Inter', sans-serif" } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  public radarChartLabels: string[] = [
    'Overall Risk',
    'Consistency',
    'Timeline Risk',
    'Skill Inflation',
    'Credibility',
    'AI Content',
    'Job Match',
    'Skill Match',
  ];

  public radarChartData: ChartData<'radar'> = {
    labels: this.radarChartLabels,
    datasets: [{ data: [0, 0, 0, 0, 0], label: 'Score Analysis' }], // Init default
  };
  public radarChartType: ChartType = 'radar';

  // Risk Definitions
  riskDefinitions = [
    {
      title: 'Overall Risk',
      icon: 'warning',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description:
        'Aggregate score reflecting total potential issues. Higher means more risk factors detected.',
    },
    {
      title: 'Consistency',
      icon: 'verified',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description:
        'Alignments between resume facts and job requirements. High consistency indicates a strong match.',
    },
    {
      title: 'Skill Inflation',
      icon: 'trending_up',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      description:
        'Potential overstatement of skills, such as listing many tools without supporting project evidence.',
    },
    {
      title: 'Timeline Risk',
      icon: 'history',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description:
        'Anomalies in work history like unexplained gaps, overlaps, or impossible durations.',
    },
    {
      title: 'Project Credibility',
      icon: 'engineering',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description:
        'Assessment of project descriptions for technical depth and authenticity vs. generic templates.',
    },
    {
      title: 'AI Content',
      icon: 'psychology',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      description: 'Probability that the resume was heavily generated or optimized using AI tools.',
    },
    {
      title: 'Job Match',
      icon: 'center_focus_strong',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      description:
        'Overall alignment between the candidate profile and the specific job description.',
    },
    {
      title: 'Skill Match',
      icon: 'code',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      description:
        'Direct overlap between the required skills for the job and the candidates experience.',
    },
  ];

  constructor() {
    // Effect to update chart when analysis changes
    effect(() => {
      const analysis = this.analysis();
      if (analysis) {
        this.radarChartData = {
          labels: this.radarChartLabels,
          datasets: [
            {
              data: [
                analysis.overallRiskScore || 0,
                analysis.overallConsistencyScore || 0,
                analysis.timelineRiskScore || 0,
                analysis.skillInflationRiskScore || 0,
                analysis.projectCredibilityRiskScore || 0,
                analysis.aiContentScore || 0,
                analysis.jobMatchScore || 0,
                analysis.skillMatchScore || 0,
              ],
              label: 'Score Analysis',
              borderColor: '#4f46e5',
              backgroundColor: 'rgba(79, 70, 229, 0.2)',
              pointBackgroundColor: '#4f46e5',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: '#4f46e5',
              fill: true,
            },
          ],
        };
      }
    });
  }

  ngOnInit() {
    this.headerService.setTitle(
      'Application Details',
      'Review application and interview status',
      'bi bi-person-lines-fill',
    );
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadApplication(id);
      this.loadTimeline(id);
      this.loadDocuments(id);
      this.startAnalysisPolling(id);
      this.loadInterviews(id);
    }
  }

  ngOnDestroy() {
    if (this.analysisPollingSub) {
      this.analysisPollingSub.unsubscribe();
    }
  }

  private analysisPollingSub?: Subscription;

  startAnalysisPolling(id: string | number) {
    if (this.analysisPollingSub) this.analysisPollingSub.unsubscribe();
    this.isPollingAnalysis.set(true);
    this.analysisPollingSub = interval(5000)
      .pipe(
        startWith(0),
        switchMap(() => this.appService.getLatestAnalysis(id)),
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.analysis.set(res);
            this.analysisPollingSub?.unsubscribe();
            this.isPollingAnalysis.set(false);
          }
        },
        error: () => {
          console.log('Analysis polling failed or not yet available');
          this.isPollingAnalysis.set(false);
          if (this.analysisPollingSub) this.analysisPollingSub.unsubscribe();
        },
      });
  }

  loadApplication(id: string | number) {
    this.appService.getApplicationDetails(id).subscribe({
      next: (app) => {
        this.application.set(app);
        if (app.candidate?.id) {
          this.loadBrandedResume(app.candidate.id);
        }

        if (app.candidate?.organization?.id) {
          this.loadPotentialCcUsers(Number(app.candidate.organization.id));
        } else {
          this.loadPotentialCcUsers();
        }
      },
      error: (error) => console.error(error),
    });
  }

  loadPotentialCcUsers(vendorOrgId?: number) {
    const internalUsers$ = this.userService.getUsers().pipe(
      map((res) => (res as any).data || res),
      catchError(() => of([])),
    );

    forkJoin([internalUsers$])
      .pipe(
        map(([internal]: [any[]]) => {
          const combined = [...internal];
          const unique = Array.from(new Map(combined.map((u) => [u.id, u])).values());
          return unique;
        }),
      )
      .subscribe((unique) => {
        this.potentialCcUsers.set(unique);
        this.cdr.markForCheck();
      });
  }

  loadBrandedResume(candidateId: string | number) {
    this.brandedResumeService.getLatest(String(candidateId)).subscribe({
      next: (br) => this.brandedResume.set(br),
      error: () => this.brandedResume.set(null),
    });
  }

  loadAnalysis(id: string | number, isPolling = false) {
    this.appService.getLatestAnalysis(id, isPolling).subscribe({
      next: (res) => {
        this.analysis.set(res);
        // If analysis is still not available and we are in a polling context or just started one
        if (!res && this.isPollingAnalysis()) {
          setTimeout(() => this.loadAnalysis(id, true), 3000);
        } else {
          this.isPollingAnalysis.set(false);
        }
      },
      error: () => {
        console.log('Analysis not found or failed');
        this.isPollingAnalysis.set(false);
      },
    });
  }

  loadTimeline(id: string | number) {
    this.appService.getTimeline(id).subscribe({
      next: (page) => {
        this.timeline.set(page.content ? page.content : page);
      },
    });
  }

  loadDocuments(id: string | number) {
    this.appService.getDocuments(id).subscribe({
      next: (docs) => this.documents.set(docs),
    });
  }

  loadInterviews(id: string | number) {
    this.interviewService.getInterviewsByApplication(Number(id)).subscribe({
      next: (res: any) => this.interviews.set(res || []),
    });
  }

  scheduleInterview() {
    if (this.scheduleForm.invalid) return;
    const appId = this.application()?.id;
    if (!appId) return;

    const request = {
      ...this.scheduleForm.value,
      applicationId: Number(appId),
      interviewerId: this.authStore.user()?.id || 1, // Default to current user for now if no selector
    };

    this.interviewService.scheduleInterview(request).subscribe({
      next: () => {
        this.showScheduleModal.set(false);
        this.loadInterviews(appId);
        this.loadTimeline(appId);
        this.scheduleForm.reset({
          durationMinutes: 30,
          type: 'TECHNICAL',
          ccUserIds: [],
          schedulingNotes: '',
        });
      },
      error: (err) => {
        this.dialogService.open('Error', 'Failed to schedule interview.');
      },
    });
  }

  runAnalysis() {
    const appId = this.application()?.id;
    if (!appId) return;
    this.isPollingAnalysis.set(true);
    this.appService.runAnalysis(appId).subscribe({
      next: () => {
        setTimeout(() => {
          this.loadAnalysis(appId);
        }, 5000);
      },
      error: () => {
        this.isPollingAnalysis.set(false);
      },
    });
  }

  downloadResume() {
    const app = this.application();
    if (!app?.id) return;

    this.appService.downloadResume(app.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume_${app.candidate?.firstName}_${app.candidate?.lastName}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url); // Clean up
      },
      error: (err) => {
        console.error('Failed to download resume', err);
        this.dialogService.open('Error', 'Failed to download resume. The file may not exist.');
      },
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
      error: () => this.dialogService.open('Error', 'Failed to download branded resume.'),
    });
  }

  updateStatus(status: ApplicationStatus) {
    const appId = this.application()?.id;
    if (!appId) return;
    this.appService.updateStatus(appId, status).subscribe((updatedApp) => {
      this.application.set(updatedApp);
      this.loadTimeline(appId);
    });
  }

  // Documents
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadDocument() {
    const appId = this.application()?.id;
    if (!this.selectedFile || !appId) return;
    this.appService.uploadDocument(appId, this.selectedCategory, this.selectedFile).subscribe({
      next: () => {
        this.selectedFile = null;
        this.loadDocuments(appId);
        this.loadTimeline(appId); // Refresh timeline to show upload event
      },
      error: (err) => {
        console.error('Failed to upload document', err);
        this.dialogService.open('Error', 'Failed to upload document. Please try again.');
      },
    });
  }

  downloadDocument(doc: any) {
    this.appService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        a.click();
        window.URL.revokeObjectURL(url); // Clean up
      },
      error: (err) => {
        console.error('Failed to download document', err);
        this.dialogService.open('Error', 'Failed to download document. The file may not exist.');
      },
    });
  }

  // Notes
  noteType = 'internal'; // internal or public

  addNote() {
    const appId = this.application()?.id;
    if (!this.newNote.trim() || !appId) return;

    const title = this.noteType === 'internal' ? 'Internal Note' : 'Message to Candidate';

    // In strict replication, we pass event object, but service expects distinct args
    // My updated service: addTimelineEvent(id, message, title, userId)
    // The previous `addTimelineEvent` took an object? No, my updated code takes args.
    // Wait, Controller takes Request Body. Service takes args.
    // My frontend `addTimelineEvent` signature:
    // `addTimelineEvent(appId, event)` from previous view.
    // Let's check `ApplicationService.ts` again.

    const event = {
      title: title,
      message: this.newNote,
      eventType: 'COMMENT', // This might be used by service to construct request
      action: 'COMMENT',
    };

    this.appService.addTimelineEvent(appId, event).subscribe(() => {
      this.newNote = '';
      this.loadTimeline(appId);
    });
  }

  getSeverityClass(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }
}
