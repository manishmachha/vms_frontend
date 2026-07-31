import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MfeNavigationService } from '../../services/mfe-navigation.service';
import { HeaderService } from '../../services/header.service';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { InterviewCalendarComponent } from '../../layout/components/interview-calendar/interview-calendar.component';
import { RecentActivityWidgetComponent } from '../components/recent-activity-widget/recent-activity-widget.component';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, InterviewCalendarComponent, RecentActivityWidgetComponent],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrls: ['./super-admin-dashboard.component.css']
})
export class SuperAdminDashboardComponent implements OnInit {
  mfeNavigation = inject(MfeNavigationService);
  headerService = inject(HeaderService);
  dashboardService = inject(DashboardService);

  dashboardStats = signal<DashboardStats | null>(null);
  loading = signal<boolean>(true);

  // Exact color mapping matching the reference image icons
  themeColors: Record<string, { cardBg: string, iconBg: string, iconText: string }> = {
    'Vendors': { cardBg: 'bg-gradient-to-br from-violet-500 to-fuchsia-600', iconBg: 'bg-white/20', iconText: 'text-white' },
    'Clients': { cardBg: 'bg-gradient-to-br from-amber-400 to-orange-500', iconBg: 'bg-white/20', iconText: 'text-white' },
    'Active Jobs': { cardBg: 'bg-gradient-to-br from-emerald-400 to-teal-500', iconBg: 'bg-white/20', iconText: 'text-white' },
    'Candidates': { cardBg: 'bg-gradient-to-br from-blue-500 to-indigo-600', iconBg: 'bg-white/20', iconText: 'text-white' },
    'Applications': { cardBg: 'bg-gradient-to-br from-pink-500 to-rose-500', iconBg: 'bg-white/20', iconText: 'text-white' },
    'Projects': { cardBg: 'bg-gradient-to-br from-indigo-500 to-purple-600', iconBg: 'bg-white/20', iconText: 'text-white' }
  };

  resolvePath(path: string): string {
    const base = this.mfeNavigation.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  ngOnInit() {
    this.headerService.setTitle(
      'Super Admin Dashboard',
      'System-wide workforce and recruitment intelligence',
      'bi bi-shield-lock-fill'
    );
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.dashboardService.getStats().subscribe({
      next: (res: any) => {
        this.dashboardStats.set(res.data || res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load admin dashboard stats', err);
        this.loading.set(false);
      }
    });
  }

  getTheme(label: string) {
    return this.themeColors[label] || { cardBg: 'bg-slate-800', iconBg: 'bg-white/20', iconText: 'text-white' };
  }

  objectKeys(obj: any): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }
}