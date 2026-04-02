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
import { Interview } from '../../models/interview.model';

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
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css'],
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

  stats = signal<StatCard[]>([
    {
      label: 'Candidates',
      value: 0,
      icon: 'bi bi-person-badge-fill',
      bgStyle: 'linear-gradient(to bottom right, #3b82f6, #1d4ed8)',
      link: '/candidates',
      trend: '+12.5%',
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
      link: '/interviews',
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
  recentInterviews = signal<Interview[]>([]);

  // Chart Configurations
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        grid: { display: false },
      },
      y: {
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  doughnutChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 8, usePointStyle: true, padding: 15, font: { size: 10 } },
      },
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
        hoverBackgroundColor: '#4f46e5',
      },
    ],
  };

  sourceChartData: ChartData<'doughnut'> = {
    labels: ['Vendor', 'Direct / Internal'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#8b5cf6', '#10b981'],
        borderWidth: 0,
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
    forkJoin({
      candidates: this.candidateService.getCandidates(),
      jobs: this.jobService.getJobs(0, 100),
      applications: this.applicationService.getApplications(undefined, 0, 1000),
      projects: this.projectService.getProjects(),
      interviews: this.interviewService.getAllInterviews(),
    }).subscribe({
      next: ({ candidates, jobs, applications, projects, interviews }) => {
        const apps = (applications as any)?.content || (Array.isArray(applications) ? applications : []);

        // Funnel Processing
        const applied = apps.filter((a: any) => a.status === 'APPLIED').length;
        const screening = apps.filter((a: any) =>
          ['SCREENING', 'SHORTLISTED'].includes(a.status),
        ).length;
        const interview = apps.filter((a: any) =>
          ['INTERVIEW_SCHEDULED', 'INTERVIEW_PASSED', 'INTERVIEW_FAILED'].includes(a.status),
        ).length;
        const offer = apps.filter((a: any) =>
          ['OFFER_RELEASED', 'OFFER_ACCEPTED', 'OFFERED'].includes(a.status),
        ).length;
        const hired = apps.filter((a: any) =>
          ['ONBOARDING_IN_PROGRESS', 'ONBOARDED', 'CONVERTED_TO_FTE', 'HIRED'].includes(a.status),
        ).length;

        // Update Stats
        this.stats.update((currentStats) => {
          const stats = [...currentStats];
          stats[0].value = (candidates as any)?.length || 0;
          stats[1].value = (jobs as any)?.totalElements ?? (jobs as any)?.length ?? 0;
          stats[2].value = (applications as any)?.totalElements ?? (applications as any)?.length ?? 0;
          stats[3].value = (projects as any)?.length || 0;
          stats[4].value = interview || 0;
          stats[5].value = offer || 0;
          return stats;
        });

        // Update Funnel
        this.funnelStages.set([
          { name: 'Applied', count: applied, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
          {
            name: 'Screening',
            count: screening,
            color: '#8b5cf6',
            bgColor: 'rgba(139, 92, 246, 0.1)',
          },
          {
            name: 'Interview',
            count: interview,
            color: '#a855f7',
            bgColor: 'rgba(168, 85, 247, 0.1)',
          },
          { name: 'Offer', count: offer, color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.1)' },
          { name: 'Hired', count: hired, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
        ]);

        // Update Charts
        this.processCharts(apps);

        // Process Recent Activity
        this.processActivity(apps, interviews);

        // Process Recent Interviews
        this.recentInterviews.set(
          (interviews as any[] || [])
            .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
            .slice(0, 10)
        );

      },
      error: (err) => {
        console.error('Unified Dashboard loading failed', err);
      },
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
          hoverBackgroundColor: '#4f46e5',
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
          borderWidth: 0,
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
        iconBg: 'bg-indigo-500',
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
        iconBg: 'bg-purple-500',
      });
    });

    this.recentActivities.set(activityList.sort((a, b) => b.id - a.id).slice(0, 5));
  }
}
