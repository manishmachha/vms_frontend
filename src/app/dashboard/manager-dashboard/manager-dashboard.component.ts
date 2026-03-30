import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin } from 'rxjs';
import { AuthStore } from '../../services/auth.store';
import { HeaderService } from '../../services/header.service';
import { InterviewCalendarComponent } from '../../layout/components/interview-calendar/interview-calendar.component';
import { JobService } from '../../services/job.service';
import { ApplicationService } from '../../services/application.service';
import { UserService } from '../../services/user.service';
import { ProjectService } from '../../services/project.service';
import { InterviewService } from '../../services/interview.service';
import { CandidateService } from '../../services/candidate.service';

interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  bgStyle: string;
  link?: string;
  trend?: string;
}

interface FunnelStage {
  name: string;
  count: number;
  color: string;
  bgColor: string;
}

interface RecentActivity {
  id: number;
  title: string;
  description: string;
  time: string;
  icon: string;
  iconBg: string;
}

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, InterviewCalendarComponent, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="space-y-6 animate-fade-in pb-10">
      <!-- Welcome Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Operations Pulse</h2>
          <p class="text-gray-500">Real-time overview of workforce and recruitment</p>
        </div>
        <div class="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span class="text-sm font-medium text-gray-600">Live System Status</span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-6 gap-4 md:gap-4">
        <a
          *ngFor="let stat of stats()"
          [routerLink]="stat.link"
          class="p-4 rounded-2xl group hover:-translate-y-1 transition-all duration-300 cursor-pointer text-white shadow-lg relative overflow-hidden"
          [style.background]="stat.bgStyle"
        >
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 rounded-lg bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform">
                <i [class]="stat.icon + ' text-lg text-white'"></i>
              </div>
              <span *ngIf="stat.trend" class="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
                {{ stat.trend }}
              </span>
            </div>
            <p class="text-xs font-semibold text-white/80 uppercase tracking-wider">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-white mt-1">
              {{ loading() ? '—' : stat.value }}
            </p>
          </div>
          <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
        </a>
      </div>

      <!-- Main Insights Row -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Recruitment Funnel -->
        <div class="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[300px]">
          <div class="flex items-center justify-between mb-8">
            <h3 class="font-bold text-gray-900 flex items-center gap-2">
              <div class="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <i class="bi bi-funnel"></i>
              </div>
              Recruitment Funnel
            </h3>
            <span class="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Active Pipeline</span>
          </div>
          
          <div class="flex-1 flex items-center justify-between gap-2 px-4">
            <div *ngFor="let stage of funnelStages(); let i = index" class="flex-1 relative group">
              <div class="text-center p-4 rounded-2xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-white"
                   [style.background]="stage.bgColor">
                <p class="text-3xl font-black mb-1 group-hover:scale-110 transition-transform" [style.color]="stage.color">{{ stage.count }}</p>
                <p class="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">{{ stage.name }}</p>
              </div>
              <div *ngIf="i < funnelStages().length - 1" class="absolute top-1/2 -right-1 transform -translate-y-1/2 z-10 hidden md:block">
                <div class="w-2 h-2 rounded-full bg-gray-200 border-2 border-white"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Candidate Sources -->
        <div class="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 class="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div class="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <i class="bi bi-pie-chart"></i>
            </div>
            Source Analytics
          </h3>
          <div class="h-48 relative">
            <canvas baseChart
              [data]="sourceChartData"
              [type]="'doughnut'"
              [options]="doughnutChartOptions"
              class="w-full h-full">
            </canvas>
          </div>
        </div>
      </div>

      <!-- Secondary Insights Row -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Applications by Job -->
        <div class="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-gray-900 flex items-center gap-2">
              <div class="p-2 rounded-lg bg-blue-50 text-blue-600">
                <i class="bi bi-bar-chart-steps"></i>
              </div>
              Applications by Job
            </h3>
          </div>
          <div class="h-[280px]">
            <canvas baseChart
              [data]="jobsChartData"
              [type]="'bar'"
              [options]="barChartOptions"
              class="w-full h-full">
            </canvas>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 class="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div class="p-2 rounded-lg bg-amber-50 text-amber-600">
              <i class="bi bi-activity"></i>
            </div>
            Recent Activity
          </h3>
          <div class="flex-1 space-y-5 overflow-y-auto max-h-[280px] custom-scrollbar pr-2">
            <div *ngFor="let activity of recentActivities()" class="flex gap-4 group cursor-default">
              <div class="shrink-0">
                <div [class]="'w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:rotate-12 ' + activity.iconBg">
                  <i [class]="activity.icon"></i>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <h4 class="text-sm font-bold text-gray-900 truncate">{{ activity.title }}</h4>
                  <span class="text-[10px] font-medium text-gray-400">{{ activity.time }}</span>
                </div>
                <p class="text-xs text-gray-500 line-clamp-1">{{ activity.description }}</p>
              </div>
            </div>
            <div *ngIf="recentActivities().length === 0" class="flex flex-col items-center justify-center h-full py-10 opacity-40">
              <i class="bi bi-inbox text-4xl mb-2"></i>
              <p class="text-sm">No recent activities</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Interview Calendar -->
        <div class="lg:col-span-12">
          <app-interview-calendar></app-interview-calendar>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #e5e7eb;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #d1d5db;
    }
  `]
})
export class ManagerDashboardComponent implements OnInit {
  authStore = inject(AuthStore);
  headerService = inject(HeaderService);
  jobService = inject(JobService);
  applicationService = inject(ApplicationService);
  userService = inject(UserService);
  projectService = inject(ProjectService);
  interviewService = inject(InterviewService);
  candidateService = inject(CandidateService);

  loading = signal(true);
  stats = signal<StatCard[]>([
    {
      label: 'Candidates',
      value: 0,
      icon: 'bi bi-person-badge-fill',
      bgStyle: 'linear-gradient(to bottom right, #3b82f6, #1d4ed8)',
      link: '/candidates',
      trend: '+12.5%'
    },
    {
      label: 'Open Jobs',
      value: 0,
      icon: 'bi bi-briefcase-fill',
      bgStyle: 'linear-gradient(to bottom right, #10b981, #059669)',
      link: '/jobs',
    },
    {
      label: 'Pipeline',
      value: 0,
      icon: 'bi bi-file-earmark-text-fill',
      bgStyle: 'linear-gradient(to bottom right, #f59e0b, #d97706)',
      link: '/applications',
    },
    {
      label: 'Projects',
      value: 0,
      icon: 'bi bi-kanban-fill',
      bgStyle: 'linear-gradient(to bottom right, #3b82f6, #2563eb)',
      link: '/projects',
    },
    {
      label: 'Interviews',
      value: 0,
      icon: 'bi bi-camera-video-fill',
      bgStyle: 'linear-gradient(to bottom right, #8b5cf6, #7c3aed)',
      link: '/applications',
    },
    {
      label: 'Offers',
      value: 0,
      icon: 'bi bi-award-fill',
      bgStyle: 'linear-gradient(to bottom right, #ec4899, #db2777)',
      link: '/applications',
    },
  ]);

  funnelStages = signal<FunnelStage[]>([
    { name: 'Applied', count: 0, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
    { name: 'Screening', count: 0, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
    { name: 'Interview', count: 0, color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.1)' },
    { name: 'Offer', count: 0, color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.1)' },
    { name: 'Hired', count: 0, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
  ]);

  recentActivities = signal<RecentActivity[]>([]);

  // Chart Configurations
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: { 
      x: { 
        beginAtZero: true,
        grid: { display: false }
      },
      y: {
        grid: { display: false }
      }
    },
    plugins: { 
      legend: { display: false }
    },
  };

  doughnutChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { 
      legend: { 
        position: 'bottom',
        labels: { boxWidth: 8, usePointStyle: true, padding: 15, font: { size: 10 } } 
      } 
    },
  };

  jobsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Applications',
        backgroundColor: '#6366f1',
        borderRadius: 6,
        hoverBackgroundColor: '#4f46e5'
      },
    ],
  };

  sourceChartData: ChartData<'doughnut'> = {
    labels: ['Vendor', 'Direct / Internal'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#8b5cf6', '#10b981'],
        borderWidth: 0
      },
    ],
  };

  ngOnInit() {
    this.headerService.setTitle(
      'Unified Dashboard',
      'End-to-end workforce and recruitment intelligence',
      'bi bi-grid-1x2-fill',
    );
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    forkJoin({
      candidates: this.candidateService.getCandidates(),
      jobs: this.jobService.getJobs(0, 100),
      applications: this.applicationService.getApplications(undefined, 0, 1000),
      projects: this.projectService.getProjects(),
      interviews: this.interviewService.getAllInterviews()
    }).subscribe({
      next: ({ candidates, jobs, applications, projects, interviews }) => {
        const apps = applications.content || [];
        
        // Funnel Processing
        const applied = apps.filter((a: any) => a.status === 'APPLIED').length;
        const screening = apps.filter((a: any) => ['SCREENING', 'SHORTLISTED'].includes(a.status)).length;
        const interview = apps.filter((a: any) => ['INTERVIEW_SCHEDULED', 'INTERVIEW_PASSED', 'INTERVIEW_FAILED'].includes(a.status)).length;
        const offer = apps.filter((a: any) => ['OFFER_RELEASED', 'OFFER_ACCEPTED', 'OFFERED'].includes(a.status)).length;
        const hired = apps.filter((a: any) => ['ONBOARDING_IN_PROGRESS', 'ONBOARDED', 'CONVERTED_TO_FTE', 'HIRED'].includes(a.status)).length;

        // Update Stats
        const currentStats = this.stats();
        currentStats[0].value = candidates.length; // Total Candidates
        currentStats[1].value = jobs.totalElements; // Open Jobs
        currentStats[2].value = applications.totalElements; // Pipeline
        currentStats[3].value = projects.length; // Projects
        currentStats[4].value = interview;
        currentStats[5].value = offer;
        this.stats.set([...currentStats]);

        // Update Funnel
        this.funnelStages.set([
          { name: 'Applied', count: applied, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
          { name: 'Screening', count: screening, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
          { name: 'Interview', count: interview, color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.1)' },
          { name: 'Offer', count: offer, color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.1)' },
          { name: 'Hired', count: hired, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
        ]);

        // Update Charts
        this.processCharts(apps);

        // Process Recent Activity
        this.processActivity(apps, interviews);

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Unified Dashboard loading failed', err);
        this.loading.set(false);
      }
    });
  }

  processCharts(apps: any[]) {
    // Applications by Job
    const appsByJob: Record<string, number> = {};
    apps.forEach((app) => {
      const title = app.job?.title || 'Unknown Position';
      appsByJob[title] = (appsByJob[title] || 0) + 1;
    });

    const topJobs = Object.entries(appsByJob)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    this.jobsChartData = {
      labels: topJobs.map(([t]) => t),
      datasets: [
        {
          data: topJobs.map(([, c]) => c),
          label: 'Applications',
          backgroundColor: '#6366f1',
          borderRadius: 6,
          hoverBackgroundColor: '#4f46e5'
        },
      ],
    };

    // Sources
    const vendorApps = apps.filter((a: any) => !!a.vendor).length;
    const directApps = apps.length - vendorApps;

    this.sourceChartData = {
      labels: ['Vendor', 'Direct / Internal'],
      datasets: [
        {
          data: [vendorApps, directApps],
          backgroundColor: ['#8b5cf6', '#10b981'],
          borderWidth: 0
        },
      ],
    };
  }

  processActivity(apps: any[], interviews: any[]) {
    const activityList: RecentActivity[] = [];

    // Latest Applications
    apps.slice(0, 3).forEach((app: any) => {
      activityList.push({
        id: app.id,
        title: 'New Application',
        description: `${app.candidate?.firstName} ${app.candidate?.lastName} applied for ${app.job?.title}`,
        time: 'Just now',
        icon: 'bi bi-person-plus-fill',
        iconBg: 'bg-indigo-500'
      });
    });

    // Latest Interviews
    interviews.slice(0, 2).forEach((interview: any) => {
      activityList.push({
        id: interview.id,
        title: 'Interview Scheduled',
        description: `${interview.application?.candidate?.firstName || 'Candidate'} scheduled for ${interview.type}`,
        time: 'Today',
        icon: 'bi bi-calendar-event-fill',
        iconBg: 'bg-purple-500'
      });
    });

    this.recentActivities.set(activityList.sort((a, b) => b.id - a.id).slice(0, 5));
  }
}
