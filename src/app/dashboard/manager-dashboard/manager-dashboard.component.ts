import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AuthStore } from '../../services/auth.store';
import { DashboardService } from '../../services/dashboard.service';
import { HeaderService } from '../../services/header.service';
import { InterviewCalendarComponent } from '../../layout/components/interview-calendar/interview-calendar.component';

interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  bgStyle: string;
  link?: string;
}

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, InterviewCalendarComponent, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <a
          *ngFor="let stat of stats()"
          [routerLink]="stat.link"
          class="stat-card group hover:-translate-y-1 transition-all duration-300 cursor-pointer text-white"
          [style.background]="stat.bgStyle"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-white/90">{{ stat.label }}</p>
              <p class="text-2xl md:text-3xl font-bold text-white mt-1">
                {{ loading() ? '—' : stat.value }}
              </p>
            </div>
            <div
              class="p-3 rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform"
            >
              <i [class]="stat.icon + ' text-xl text-white'"></i>
            </div>
          </div>
        </a>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Stats/Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Charts can be added here -->
          <div class="card-modern p-6 h-[400px]">
            <h3 class="text-lg font-bold text-gray-900 mb-6">Attendance Overview</h3>
            <div class="h-64">
              <canvas baseChart 
                [data]="attendanceChartData" 
                [options]="lineChartOptions" 
                [type]="'line'">
              </canvas>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              routerLink="/admin/employees"
              class="card-modern p-4 flex items-center gap-3 group cursor-pointer hover:border-indigo-100 hover:shadow-lg transition-all"
            >
              <div
                class="p-3 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform"
                style="background: linear-gradient(to bottom right, #6366f1, #4f46e5)"
              >
                <i class="bi bi-people text-lg"></i>
              </div>
              <div>
                <h3
                  class="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm"
                >
                  Employees
                </h3>
                <p class="text-xs text-gray-500">Manage users</p>
              </div>
            </a>
          </div>
        </div>

        <!-- Right Side: Interview Calendar -->
        <div class="lg:col-span-1">
          <app-interview-calendar></app-interview-calendar>
        </div>
      </div>
    </div>
  `,
})
export class ManagerDashboardComponent implements OnInit {
  authStore = inject(AuthStore);
  headerService = inject(HeaderService);
  dashboardService = inject(DashboardService);

  loading = signal(true);
  stats = signal<StatCard[]>([
    {
      label: 'Total Employees',
      value: 0,
      icon: 'bi bi-people-fill',
      bgStyle: 'linear-gradient(to bottom right, #6366f1, #4f46e5)',
      link: '/admin/employees',
    },
    {
      label: 'Active Jobs',
      value: 0,
      icon: 'bi bi-briefcase-fill',
      bgStyle: 'linear-gradient(to bottom right, #10b981, #059669)',
      link: '/jobs',
    },
    {
      label: 'Applications',
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
  ]);

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, max: 100 } },
    plugins: { legend: { display: true, position: 'top' } },
  };

  attendanceChartData: ChartData<'line'> = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        data: [92, 88, 95, 91, 85, 45],
        label: 'Attendance %',
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  ngOnInit() {
    this.headerService.setTitle(
      'HR Dashboard',
      'Employee management and HR operations',
      'bi bi-person-gear',
    );
    this.loading.set(false);
  }
}
