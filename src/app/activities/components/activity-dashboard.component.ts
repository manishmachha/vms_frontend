import { Component, OnInit, inject, signal, computed, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { ActivityService, ActivityLog, ActivityLogStatsResponse } from '../services/activity.service';
import { UserService } from '../../services/user.service';
import { AuthStore } from '../../services/auth.store';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivityDetailDialogComponent } from './activity-detail-dialog.component';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartOptions, ChartType } from 'chart.js';

@Component({
  selector: 'app-activity-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    BaseChartDirective
  ],
  providers: [
    provideCharts(withDefaultRegisterables())
  ],
  templateUrl: './activity-dashboard.component.html',
  styleUrls: ['./activity-dashboard.component.css']
})
export class ActivityDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private activityService = inject(ActivityService);
  private userService = inject(UserService);
  private authStore = inject(AuthStore);
  private dialog = inject(MatDialog);

  // Data state
  activities = signal<ActivityLog[]>([]);
  stats = signal<ActivityLogStatsResponse | null>(null);
  users = signal<any[]>([]);
  filteredUsers = signal<any[]>([]);
  totalElements = signal<number>(0);
  loading = signal<boolean>(false);

  // Filter state
  searchQuery = signal<string>('');
  selectedAction = signal<string>('');
  selectedCategory = signal<string>('');
  selectedUser = signal<string>('');
  selectedTimeRange = signal<string>('30days');
  userSearchQuery = signal<string>('');

  // Table state
  displayedColumns: string[] = ['timestamp', 'action', 'entityType', 'entityLabel', 'actorEmail', 'message', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Chart configuration
  public lineChartData = signal<ChartData<'line'>>({
    labels: [],
    datasets: []
  });
  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' }
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } }
    }
  };
  public lineChartType: ChartType = 'line';

  // RxJS triggers for fetching data
  private filterChange$ = new BehaviorSubject<void>(undefined);
  private destroy$ = new Subject<void>();

  constructor() {
    // Debounce search query
    this.filterChange$.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadActivities();
      this.loadStats();
    });
  }

  ngOnInit() {
    this.loadStats();
    this.loadUsers();
  }

  ngAfterViewInit() {
    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadActivities();
      });
    }

    if (this.paginator) {
      this.paginator.page.subscribe(() => {
        this.loadActivities();
      });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getDateRange(): { start?: string, end?: string } {
    const range = this.selectedTimeRange();
    if (!range || range === 'all') return {};

    const end = new Date();
    const start = new Date();
    if (range === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (range === '7days') {
      start.setDate(end.getDate() - 7);
    } else if (range === '30days') {
      start.setDate(end.getDate() - 30);
    }
    
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  loadStats() {
    const orgId = this.authStore.organizationId();
    if (!orgId) return;

    const dates = this.getDateRange();

    this.activityService.getActivityStats(
      orgId.toString(),
      this.selectedAction(),
      this.selectedCategory(),
      this.searchQuery(),
      this.selectedUser(),
      dates.start,
      dates.end
    ).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.updateChartData(data);
      },
      error: (err) => console.error('Failed to load stats', err)
    });
  }

  private updateChartData(stats: ActivityLogStatsResponse) {
    if (!stats || !stats.activitiesByDate) {
      this.lineChartData.set({ labels: [], datasets: [] });
      return;
    }

    // Merge all unique dates from all maps to ensure no gaps
    const allDates = new Set([
      ...Object.keys(stats.activitiesByDate || {}),
      ...Object.keys(stats.createsByDate || {}),
      ...Object.keys(stats.updatesByDate || {}),
      ...Object.keys(stats.deletesByDate || {})
    ]);
    
    const sortedDates = Array.from(allDates).sort();
    
    const totalCounts = sortedDates.map(date => stats.activitiesByDate?.[date] || 0);
    const createsCounts = sortedDates.map(date => stats.createsByDate?.[date] || 0);
    const updatesCounts = sortedDates.map(date => stats.updatesByDate?.[date] || 0);
    const deletesCounts = sortedDates.map(date => stats.deletesByDate?.[date] || 0);

    this.lineChartData.set({
      labels: sortedDates,
      datasets: [
        {
          data: totalCounts,
          label: 'Total',
          borderColor: '#473dff', // indigo-500
          backgroundColor: 'transparent',
          tension: 0.3,
          fill: false,
          hidden: false // hide by default so it's not too cluttered
        },
        {
          data: createsCounts,
          label: 'Creates',
          borderColor: '#10b981', // emerald-500
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          data: updatesCounts,
          label: 'Updates',
          borderColor: '#f59e0b', // amber-500
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          data: deletesCounts,
          label: 'Deletes',
          borderColor: '#ef4444', // red-500
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    });
  }

  loadUsers() {
    const orgId = this.authStore.organizationId();
    if (!orgId) return;

    this.userService.getUsersByOrganization(orgId).subscribe({
      next: (res) => {
        this.users.set(res);
        this.filteredUsers.set(res);
      },
      error: (err) => console.error('Failed to load users', err)
    });
  }

  loadActivities() {
    const orgId = this.authStore.organizationId();
    if (!orgId) return;

    this.loading.set(true);

    const page = this.paginator ? this.paginator.pageIndex : 0;
    const size = this.paginator ? this.paginator.pageSize : 20;
    const sortField = this.sort ? this.sort.active : 'timestamp';
    const sortDirection = this.sort ? this.sort.direction || 'desc' : 'desc';

    const dates = this.getDateRange();

    this.activityService.getActivities(
      orgId.toString(),
      this.selectedAction(),
      this.selectedCategory(),
      this.searchQuery(),
      this.selectedUser(),
      page,
      size,
      sortField,
      sortDirection,
      undefined,
      dates.start,
      dates.end
    ).subscribe({
      next: (res) => {
        this.activities.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load activities', err);
        this.loading.set(false);
      }
    });
  }

  onFilterChange() {
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.filterChange$.next();
  }

  onUserSearch(event: any) {
    const term = event.target.value.toLowerCase();
    this.userSearchQuery.set(term);

    if (!term) {
      this.filteredUsers.set(this.users());
    } else {
      const filtered = this.users().filter(u =>
        (u.firstName && u.firstName.toLowerCase().includes(term)) ||
        (u.lastName && u.lastName.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term))
      );
      this.filteredUsers.set(filtered);
    }
  }

  viewActivity(activity: ActivityLog) {
    this.dialog.open(ActivityDetailDialogComponent, {
      width: '600px',
      data: { activity },
      panelClass: 'dialog-modern'
    });
  }

  getActionIcon(action: string): string {
    switch (action?.toUpperCase()) {
      case 'CREATE': return 'add_circle';
      case 'UPDATE': return 'edit';
      case 'DELETE': return 'delete';
      default: return 'info';
    }
  }

  getActionColorClass(action: string): string {
    switch (action?.toUpperCase()) {
      case 'CREATE': return 'text-emerald-500 bg-emerald-50';
      case 'UPDATE': return 'text-amber-500 bg-amber-50';
      case 'DELETE': return 'text-red-500 bg-red-50';
      default: return 'text-indigo-500 bg-indigo-50';
    }
  }
}
