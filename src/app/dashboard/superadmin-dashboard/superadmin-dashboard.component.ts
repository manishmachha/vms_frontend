import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderService } from '../../services/header.service';
import { AuthStore } from '../../services/auth.store';
import { DashboardService, RecentActivity } from '../../services/dashboard.service';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { HubDashboardBannerComponent } from '../../shared/components/hub-dashboard-banner/hub-dashboard-banner.component';
import { StatItem } from '../../models/dashboard-stats.model';

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, HubDashboardBannerComponent, DatePipe],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="space-y-8 animate-fade-in pb-8">
      
      <!-- Top Banner Stats -->
      <div>
        <app-hub-dashboard-banner [stats]="stats()"></app-hub-dashboard-banner>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left Column: Charts -->
        <div class="lg:col-span-2 space-y-8">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Recruitment Pipeline -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[360px] hover:shadow-md transition-shadow">
              <h3 class="font-bold text-slate-800 mb-6 flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <i class="bi bi-funnel text-lg"></i>
                </div>
                Recruitment Pipeline
              </h3>
              <div class="flex-1 relative min-w-0 min-h-0">
                <canvas baseChart [data]="pipelineChartData" [type]="'bar'" [options]="barChartOptions" class="w-full h-full"></canvas>
              </div>
            </div>

            <!-- Organization Distribution -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[360px] hover:shadow-md transition-shadow">
              <h3 class="font-bold text-slate-800 mb-6 flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <i class="bi bi-diagram-3 text-lg"></i>
                </div>
                Platform Distribution
              </h3>
              <div class="flex-1 relative min-w-0 min-h-0">
                <canvas baseChart [data]="orgDistChartData" [type]="'doughnut'" [options]="doughnutChartOptions" class="w-full h-full"></canvas>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <h3 class="font-bold text-slate-800 mb-4 text-lg">Quick Actions</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <a routerLink="/jobs/create" class="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 group cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all">
              <div class="w-12 h-12 rounded-xl text-indigo-600 bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i class="bi bi-briefcase text-xl"></i>
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Post Job</h3>
              </div>
            </a>
            <a routerLink="/admin/employees" class="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 group cursor-pointer hover:border-purple-300 hover:shadow-md transition-all">
              <div class="w-12 h-12 rounded-xl text-purple-600 bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i class="bi bi-person-plus text-xl"></i>
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">Users</h3>
              </div>
            </a>
            <a routerLink="/applications" class="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 group cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all">
              <div class="w-12 h-12 rounded-xl text-emerald-600 bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i class="bi bi-file-earmark-check text-xl"></i>
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Approvals</h3>
              </div>
            </a>
          </div>

        </div>

        <!-- Right Column: Recent Activity Feed -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[700px] overflow-hidden">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-slate-800 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <i class="bi bi-activity text-lg"></i>
              </div>
              Global Activity Feed
            </h3>
            <span class="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">Live</span>
          </div>
          
          <div class="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
            @if(loading()) {
              <div class="flex justify-center items-center h-32">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            } @else {
              @for (activity of activities(); track activity.id) {
                <div class="relative pl-6 border-l-2 border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-indigo-100" [ngClass]="getActivityBadgeColor(activity.action)"></div>
                  <div class="mb-1">
                    <span class="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mr-2">{{ activity.orgName }}</span>
                    <span class="text-xs text-slate-500">{{ activity.createdAt | date:'short' }}</span>
                  </div>
                  <p class="text-sm font-medium text-slate-800">{{ activity.title }}</p>
                  <p class="text-sm text-slate-500 mt-1 line-clamp-2">{{ activity.message }}</p>
                </div>
              }
              @if(activities().length === 0) {
                <div class="text-center text-slate-500 py-8">
                  <i class="bi bi-inbox text-3xl mb-3 block opacity-50"></i>
                  <p class="text-sm">No recent activity found.</p>
                </div>
              }
            }
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* Custom scrollbar for activity feed */
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
    }
  `]
})
export class SuperadminDashboardComponent implements OnInit {
  authStore = inject(AuthStore);
  headerService = inject(HeaderService);
  dashboardService = inject(DashboardService);

  loading = signal(true);
  stats = signal<StatItem[]>([]);
  activities = signal<RecentActivity[]>([]);

  // Chart configurations
  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 8,
      }
    },
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { 
      y: { 
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        border: { display: false }
      },
      x: {
        grid: { display: false },
        border: { display: false }
      }
    },
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 8,
      }
    },
  };

  orgDistChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }],
  };

  pipelineChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Count', backgroundColor: '#6366f1' }],
  };

  ngOnInit() {
    this.headerService.setTitle(
      'Super Admin Hub',
      'Global platform insights and real-time activity',
      'bi bi-globe'
    );
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        // Set Banner Stats
        if (data.stats && data.stats.length > 0) {
          this.stats.set(data.stats);
        }

        // Set Recent Activity
        if (data.recentActivity) {
          this.activities.set(data.recentActivity);
        }

        // Set Organization Distribution (Doughnut)
        if (data.orgDistribution) {
          this.orgDistChartData = {
            labels: data.orgDistribution.map((d) => d.label),
            datasets: [
              {
                data: data.orgDistribution.map((d) => d.value),
                backgroundColor: ['#64748b', '#06b6d4', '#f59e0b', '#8b5cf6'],
                borderWidth: 0,
                hoverOffset: 4
              },
            ],
          };
        }

        // Set Pipeline (Bar Chart)
        if (data.recruitmentPipeline) {
          this.pipelineChartData = {
            labels: data.recruitmentPipeline.map((d) => d.label.replace('_', ' ')),
            datasets: [
              {
                data: data.recruitmentPipeline.map((d) => d.value),
                label: 'Applications',
                backgroundColor: '#6366f1',
                hoverBackgroundColor: '#4f46e5',
                borderRadius: 4,
                barPercentage: 0.6
              },
            ],
          };
        }

        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getActivityBadgeColor(action: string): string {
    const act = action?.toUpperCase() || '';
    if (act.includes('CREATE') || act.includes('ADD')) return '!border-emerald-500';
    if (act.includes('UPDATE') || act.includes('EDIT')) return '!border-blue-500';
    if (act.includes('DELETE') || act.includes('REMOVE')) return '!border-red-500';
    if (act.includes('APPROVE')) return '!border-indigo-500';
    return '!border-slate-300';
  }
}
