import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MfeNavigationService } from '../../services/mfe-navigation.service';
import { AuthStore } from '../../services/auth.store';
import { HeaderService } from '../../services/header.service';
import { EmployeeDashboardService, EmployeeDashboardStats } from '../../services/employee-dashboard.service';

interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  bgStyle: string;
  link?: string;
  trend?: string;
}

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 animate-fade-in pb-10">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Employee Workspace</h2>
          <p class="text-gray-500">Welcome to your dashboard</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-4">
        <a
          *ngFor="let stat of stats()"
          [routerLink]="resolvePath(stat.link || '')"
          class="p-4 rounded-2xl group hover:-translate-y-1 transition-all duration-300 cursor-pointer text-white shadow-lg relative overflow-hidden"
          [style.background]="stat.bgStyle"
        >
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div
                class="p-2 rounded-lg bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform"
              >
                <i [class]="stat.icon + ' text-lg text-white'"></i>
              </div>
            </div>
            <div class="mt-2">
              <div class="text-3xl font-bold text-white">{{ stat.value }}</div>
              <p class="text-xs font-medium text-white/80 uppercase tracking-wider">
                {{ stat.label }}
              </p>
            </div>
          </div>
          <div
            class="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"
          ></div>
        </a>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div class="bg-white p-5 rounded-2xl border border-slate-200">
          <h3 class="font-bold text-slate-800 text-lg mb-4">Quick Actions</h3>
          <div class="grid grid-cols-1 gap-4">
            <a
              [routerLink]="resolvePath('/timesheets')"
              class="flex items-center gap-4 group cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-all"
            >
              <div class="w-10 h-10 rounded-lg text-indigo-600 bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i class="bi bi-clock-history"></i>
              </div>
              <div>
                <h4 class="font-semibold text-slate-900 group-hover:text-indigo-600">
                  Submit Timesheet
                </h4>
                <p class="text-xs text-gray-500">Log your weekly hours</p>
              </div>
            </a>
            
            <a
              [routerLink]="resolvePath('/projects')"
              class="flex items-center gap-4 group cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-all"
            >
              <div class="w-10 h-10 rounded-lg text-emerald-600 bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i class="bi bi-kanban"></i>
              </div>
              <div>
                <h4 class="font-semibold text-slate-900 group-hover:text-emerald-600">
                  My Projects
                </h4>
                <p class="text-xs text-gray-500">View current allocations</p>
              </div>
            </a>
            
            <a
              [routerLink]="resolvePath('/tickets')"
              class="flex items-center gap-4 group cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-all"
            >
              <div class="w-10 h-10 rounded-lg text-orange-600 bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i class="bi bi-ticket-detailed"></i>
              </div>
              <div>
                <h4 class="font-semibold text-slate-900 group-hover:text-orange-600">
                  Help Desk
                </h4>
                <p class="text-xs text-gray-500">Submit or check support tickets</p>
              </div>
            </a>
            
            <a
              [routerLink]="resolvePath('/interviews')"
              class="flex items-center gap-4 group cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-all"
            >
              <div class="w-10 h-10 rounded-lg text-purple-600 bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i class="bi bi-calendar-check"></i>
              </div>
              <div>
                <h4 class="font-semibold text-slate-900 group-hover:text-purple-600">
                  My Interviews
                </h4>
                <p class="text-xs text-gray-500">Check scheduled interviews</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EmployeeDashboardComponent implements OnInit {
  authStore = inject(AuthStore);
  headerService = inject(HeaderService);
  dashboardService = inject(EmployeeDashboardService);
  private mfeNav = inject(MfeNavigationService);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  stats = signal<StatCard[]>([
    {
      label: 'Active Projects',
      value: 0,
      icon: 'bi bi-kanban-fill',
      bgStyle: 'linear-gradient(to bottom right, #3b82f6, #1d4ed8)',
      link: '/projects',
    },
    {
      label: 'Pending Interviews',
      value: 0,
      icon: 'bi bi-camera-video-fill',
      bgStyle: 'linear-gradient(to bottom right, #10b981, #059669)',
      link: '/interviews',
    },
    {
      label: 'Open Tickets',
      value: 0,
      icon: 'bi bi-ticket-detailed-fill',
      bgStyle: 'linear-gradient(to bottom right, #f59e0b, #d97706)',
      link: '/tickets',
    },
    {
      label: 'Draft Timesheets',
      value: 0,
      icon: 'bi bi-clock-history',
      bgStyle: 'linear-gradient(to bottom right, #8b5cf6, #7c3aed)',
      link: '/timesheets',
    },
  ]);

  ngOnInit() {
    this.headerService.setTitle(
      'Employee Dashboard',
      'Overview of your tasks and activities',
      'bi bi-person-workspace',
    );
    this.loadData();
  }

  loadData() {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.update((currentStats) => {
          const stats = [...currentStats];
          stats[0].value = data.activeProjects || 0;
          stats[1].value = data.pendingInterviews || 0;
          stats[2].value = data.openTickets || 0;
          stats[3].value = data.draftTimesheets || 0;
          return stats;
        });
      },
      error: (err) => console.error('Failed to load dashboard stats', err)
    });
  }
}
