import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { DashboardService } from '../../services/dashboard.service';
import { forkJoin, Observable, of } from 'rxjs';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { JobApplication } from '../../models/application.model';
import { ApplicationService } from '../../services/application.service';
import { AuditLogService } from '../../services/audit-log.service';
import { AuthStore } from '../../services/auth.store';
import { HeaderService } from '../../services/header.service';
import { JobService } from '../../services/job.service';
import { ProjectService } from '../../services/project.service';
import { UserService } from '../../services/user.service';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  bgStyle: string; // Changed from gradient class to inline style
  trend?: string;
  trendUp?: boolean;
}

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, ReactiveFormsModule],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './vendor-dashboard.component.html',
  styleUrls: ['./vendor-dashboard.component.css'],
})
export class VendorDashboardComponent implements OnInit {
  headerService = inject(HeaderService);
  authStore = inject(AuthStore);
  fb = inject(FormBuilder);

  // Services
  jobService = inject(JobService);
  userService = inject(UserService);
  applicationService = inject(ApplicationService);
  auditLogService = inject(AuditLogService);
  projectService = inject(ProjectService);
  dashboardService = inject(DashboardService);

  // --- Solventek State ---
  solventekStats = signal<StatCard[]>([
    {
      label: 'Active Jobs',
      value: 0,
      icon: 'bi bi-briefcase-fill',
      bgStyle: 'linear-gradient(to bottom right, #3b82f6, #2563eb)',
      trend: '+12% this week',
      trendUp: true,
    },
    {
      label: 'Total Candidates',
      value: 0,
      icon: 'bi bi-people-fill',
      bgStyle: 'linear-gradient(to bottom right, #a855f7, #9333ea)',
      trend: '+8% this week',
      trendUp: true,
    },
    {
      label: 'Total Applications',
      value: 0,
      icon: 'bi bi-file-earmark-text-fill',
      bgStyle: 'linear-gradient(to bottom right, #10b981, #059669)',
    },
    {
      label: 'Pending Approvals',
      value: 0,
      icon: 'bi bi-clock-fill',
      bgStyle: 'linear-gradient(to bottom right, #f97316, #ea580c)',
    },
  ]);
  pipelineStages = signal<any[]>([]);
  recentActivity = signal<any[]>([]);

  // Chart Data (Solventek Admin)
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } },
  };
  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
      },
    ],
  };
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } },
  };
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      { data: [], backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'] },
    ],
  };
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: false } },
  };
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Assets', backgroundColor: '#3b82f6', borderRadius: 4 }],
  };
  public polarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } },
  };
  public polarAreaChartData: ChartData<'polarArea'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'] }],
  };
  public clientBarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: { x: { beginAtZero: true } },
    plugins: { legend: { display: false } },
  };
  public clientBarChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Projects', backgroundColor: '#8b5cf6', borderRadius: 4 }],
  };

  // --- Vendor State ---
  activeJobsCount = signal(0);
  applicationsCount = signal(0);
  shortlistedCount = signal(0);
  candidatesCount = signal(0);
  vendorRecentApps = signal<JobApplication[]>([]);

  // --- Client State ---
  activeProjectsCount = 0;
  clientApplications: JobApplication[] = [];
  totalCandidatesCount = signal(0);
  selectedApp: JobApplication | null = null;
  isApproving = false;
  decisionForm = this.fb.group({
    feedback: ['', Validators.required],
  });

  ngOnInit() {
    this.updateHeader();
    this.loadData();
  }

  updateHeader() {
    const orgType = this.authStore.orgType();
    let title = 'Dashboard';
    let subtitle = `Welcome back, ${this.authStore.user()?.firstName}`;
    let icon = 'bi bi-grid';

    if (orgType === 'VENDOR') {
      title = 'Vendor Portal';
      subtitle = 'Manage your talent submissions';
      icon = 'bi bi-shop';
    }

    this.headerService.setTitle(title, subtitle, icon);
  }

  loadData() {
    const orgType = this.authStore.orgType();
    if (orgType === 'SOLVENTEK') {
      this.loadSolventekData();
    } else if (orgType === 'VENDOR') {
      this.loadVendorData();
    }
  }

  // --- Helpers ---
  isSolventek() {
    return this.authStore.orgType() === 'SOLVENTEK';
  }
  isVendor() {
    return this.authStore.orgType() === 'VENDOR';
  }
  isAdmin() {
    return this.authStore.userRole() === 'SUPER_ADMIN' || this.authStore.userRole() === 'MANAGER';
  }

  getBannerGradient(): string {
    if (this.isVendor()) return 'linear-gradient(to right, #059669, #0d9488, #06b6d4)';
    return 'linear-gradient(to right, #4f46e5, #9333ea, #ec4899)';
  }

  getPortalTitle(): string {
    if (this.isVendor()) return 'Vendor Portal';
    return 'Management System';
  }

  getWelcomeEmoji(): string {
    if (this.isVendor()) return '🚀';
    return '👋';
  }

  getWelcomeMessage(): string {
    if (this.isVendor())
      return 'Find opportunities and submit your best candidates for open positions.';
    return "Here's what's happening with your vendor management system today.";
  }

  // --- SOLVENTEK LOGIC ---
  loadSolventekData() {
    // ... existing logic ...
    forkJoin({
      jobs: this.jobService.getJobs(0, 1),
      candidates: this.userService.getUsers(0, 1),
      applications: this.applicationService.getApplications(undefined, 0, 100),
      activity: this.auditLogService.getAuditLogs(0, 5),
      dashboardStats: this.isAdmin() ? this.dashboardService.getStats() : of(null),
    }).subscribe({
      next: (results) => {
        const currentStats = this.solventekStats();
        currentStats[0].value = results.jobs.totalElements;
        currentStats[1].value = results.candidates.length;
        const apps = results.applications.content;
        currentStats[2].value = results.applications.totalElements;
        currentStats[3].value = apps.filter((a) => a.status === 'APPLIED').length;
        this.solventekStats.set([...currentStats]);
        this.solventekStats.set([...currentStats]);

        this.processPipeline(apps, results.applications.totalElements);
        this.recentActivity.set(results.activity.content);

        if (results.dashboardStats) {
          this.updateCharts(results.dashboardStats);
        }
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
      },
    });
  }

  processPipeline(applications: any[], total: number) {
    if (total === 0) {
      this.pipelineStages.set([{ name: 'Applied', count: 0, percentage: 0, color: '#6366f1' }]);
      return;
    }
    const applied = applications.filter((a) => ['APPLIED'].includes(a.status)).length;
    const screening = applications.filter((a) =>
      ['SCREENING', 'SHORTLISTED'].includes(a.status),
    ).length;
    const interview = applications.filter((a) =>
      ['INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED'].includes(a.status),
    ).length;
    const offer = applications.filter((a) =>
      ['OFFER_RELEASED', 'OFFER_ACCEPTED', 'HIRED'].includes(a.status),
    ).length;

    this.pipelineStages.set([
      {
        name: 'Applied/Pending',
        count: applied,
        percentage: (applied / total) * 100,
        color: '#6366f1',
      },
      {
        name: 'Screening',
        count: screening,
        percentage: (screening / total) * 100,
        color: '#8b5cf6',
      },
      {
        name: 'Interview',
        count: interview,
        percentage: (interview / total) * 100,
        color: '#a855f7',
      },
      { name: 'Offer/Hired', count: offer, percentage: (offer / total) * 100, color: '#10b981' },
    ]);
  }

  updateCharts(data: any) {
    this.pieChartData = {
      labels: data.employeesByDepartment.map((d: any) => d.label),
      datasets: [
        {
          data: data.employeesByDepartment.map((d: any) => d.value),
          backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
        },
      ],
    };
    this.doughnutChartData = {
      labels: data.projectsByStatus.map((d: any) => d.label),
      datasets: [
        {
          data: data.projectsByStatus.map((d: any) => d.value),
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'],
        },
      ],
    };
    this.barChartData = {
      labels: data.assetsByType.map((d: any) => d.label),
      datasets: [
        {
          data: data.assetsByType.map((d: any) => d.value),
          label: 'Assets',
          backgroundColor: '#3b82f6',
          borderRadius: 4,
        },
      ],
    };
    this.polarAreaChartData = {
      labels: data.employeeStatusDistribution.map((d: any) => d.label),
      datasets: [
        {
          data: data.employeeStatusDistribution.map((d: any) => d.value),
          backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'],
        },
      ],
    };
    this.clientBarChartData = {
      labels: data.projectsByClient.map((d: any) => d.label),
      datasets: [
        {
          data: data.projectsByClient.map((d: any) => d.value),
          label: 'Projects',
          backgroundColor: '#8b5cf6',
          borderRadius: 4,
        },
      ],
    };
  }

  // --- VENDOR LOGIC ---
  loadVendorData() {
    this.jobService.getJobs().subscribe((page) => this.activeJobsCount.set(page.totalElements));
    this.applicationService.getApplications(undefined, 0, 100, 'OUTBOUND').subscribe({
      next: (page: any) => {
        const apps = page.content;
        this.applicationsCount.set(page.totalElements);
        this.vendorRecentApps.set(apps.slice(0, 5));
        const shortlisted = apps.filter((a: any) =>
          ['SHORTLISTED', 'INTERVIEW_SCHEDULED'].includes(a.status),
        ).length;
        this.shortlistedCount.set(shortlisted);
        const uniqueCandidates = new Set(apps.map((a: any) => a.email)).size;
        this.candidatesCount.set(uniqueCandidates);
      },
      error: (err: any) => {
        console.error('Failed to load vendor stats', err);
      },
    });
  }

  // --- CLIENT LOGIC --- (Deprecated - CLIENT org type removed)
  loadClientData() {
    // No-op: CLIENT organization type has been removed
  }

  openDecisionModal(app: any, approve: boolean) {
    this.selectedApp = app;
    this.isApproving = approve;
    this.decisionForm.reset();
  }

  confirmDecision() {
    if (this.selectedApp && this.decisionForm.valid) {
      const feedback = this.decisionForm.value.feedback!;
      this.applicationService
        .makeClientDecision(String(this.selectedApp.id), this.isApproving, feedback)
        .subscribe(() => {
          this.selectedApp = null;
          this.loadClientData(); // Refresh
        });
    }
  }
}
