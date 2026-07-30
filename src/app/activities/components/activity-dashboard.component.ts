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
    MatChipsModule
  ],
  templateUrl: './activity-dashboard.component.html',
  styleUrls: ['./activity-dashboard.component.css']
})
export class ActivityDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private activityService = inject(ActivityService);
  private userService = inject(UserService);
  private authStore = inject(AuthStore);

  // View state
  viewMode = signal<'grid' | 'table'>('grid');
  
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
  userSearchQuery = signal<string>('');
  
  // Table state
  displayedColumns: string[] = ['timestamp', 'action', 'entityType', 'entityLabel', 'actorEmail', 'message'];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

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
    });
  }

  ngOnInit() {
    this.loadStats();
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(() => {
      this.paginator.pageIndex = 0;
      this.loadActivities();
    });
    
    this.paginator.page.subscribe(() => {
      this.loadActivities();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStats() {
    const orgId = this.authStore.organizationId();
    if (!orgId) return;

    this.activityService.getActivityStats(orgId.toString()).subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('Failed to load stats', err)
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

    this.activityService.getActivities(
      orgId.toString(),
      this.selectedAction(),
      this.selectedCategory(),
      this.searchQuery(),
      this.selectedUser(),
      page,
      size,
      sortField,
      sortDirection
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

  toggleViewMode(mode: 'grid' | 'table') {
    this.viewMode.set(mode);
  }

  getActionIcon(action: string): string {
    switch(action?.toUpperCase()) {
      case 'CREATE': return 'add_circle';
      case 'UPDATE': return 'edit';
      case 'DELETE': return 'delete';
      default: return 'info';
    }
  }

  getActionColorClass(action: string): string {
    switch(action?.toUpperCase()) {
      case 'CREATE': return 'text-emerald-500 bg-emerald-50';
      case 'UPDATE': return 'text-amber-500 bg-amber-50';
      case 'DELETE': return 'text-red-500 bg-red-50';
      default: return 'text-indigo-500 bg-indigo-50';
    }
  }
}
