import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ActivityService, ActivityLog } from '../../../activities/services/activity.service';
import { AuthStore } from '../../../services/auth.store';
import { MfeNavigationService } from '../../../services/mfe-navigation.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-recent-activity-widget',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" [class.h-full]="fullHeight">
      <div class="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 class="text-sm font-bold text-gray-900 flex items-center gap-2">
          <mat-icon class="text-indigo-600! icon-sm">history</mat-icon>
          Recent Activity
        </h3>
        <a [routerLink]="resolvePath('/activities')" class="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
          View All
        </a>
      </div>

      <div class="p-4 custom-scrollbar overflow-y-auto" [ngClass]="containerClass">
        <div *ngIf="loading()" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>

        <div *ngIf="!loading() && activities().length === 0" class="flex flex-col items-center justify-center py-10 opacity-40">
          <mat-icon class="text-4xl mb-2">history_toggle_off</mat-icon>
          <p class="text-xs font-medium">No recent activities found.</p>
        </div>

        <div *ngIf="!loading() && activities().length > 0" class="space-y-4">
          <div *ngFor="let activity of activities()" class="flex gap-4">
            <div class="relative mt-1">
              <div class="absolute top-6 bottom-[-16px] left-1/2 -translate-x-1/2 w-[2px] bg-gray-100"></div>
              <div class="w-8 h-8 rounded-full flex items-center justify-center relative z-10 border-2 border-white shadow-sm"
                   [ngClass]="getActionColorClass(activity.action)">
                <mat-icon class="text-[16px] w-[16px] h-[16px]">{{ getActionIcon(activity.action) }}</mat-icon>
              </div>
            </div>
            
            <div class="flex-1 pb-4">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold text-gray-900">{{ activity.entityLabel || activity.entityType }}</span>
                <span class="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">{{ activity.timestamp | date:'short' }}</span>
              </div>
              <p class="text-xs text-gray-600 leading-relaxed">{{ activity.message }}</p>
              <div class="mt-2 flex items-center gap-2">
                <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
                      [ngClass]="getActionColorClass(activity.action, true)">
                  {{ activity.action }}
                </span>
                <span *ngIf="!forCurrentUser" class="text-[10px] text-gray-500 font-medium">
                  by {{ activity.actorEmail }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .icon-sm {
      width: 18px;
      height: 18px;
      font-size: 18px;
    }
  `]
})
export class RecentActivityWidgetComponent implements OnInit {
  @Input() forCurrentUser: boolean = false;
  @Input() limit: number = 10;
  @Input() fullHeight: boolean = false;
  @Input() containerClass: string = 'max-h-[400px]';

  private activityService = inject(ActivityService);
  private authStore = inject(AuthStore);
  private mfeNav = inject(MfeNavigationService);

  activities = signal<ActivityLog[]>([]);
  loading = signal<boolean>(true);

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  ngOnInit() {
    this.loadActivities();
  }

  loadActivities() {
    const orgId = this.authStore.organizationId();
    const userFilter = this.forCurrentUser ? this.authStore.user()?.email : undefined;

    this.activityService.getActivities(
      orgId?.toString(),
      undefined,
      undefined,
      undefined,
      userFilter,
      0,
      this.limit,
      'timestamp',
      'desc'
    ).subscribe({
      next: (res) => {
        this.activities.set(res.content || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load recent activities', err);
        this.loading.set(false);
      }
    });
  }

  getActionIcon(action: string): string {
    switch (action?.toUpperCase()) {
      case 'CREATE': return 'add';
      case 'UPDATE': return 'edit';
      case 'DELETE': return 'delete';
      default: return 'info';
    }
  }

  getActionColorClass(action: string, isPill = false): string {
    const act = action?.toUpperCase();
    if (isPill) {
      switch (act) {
        case 'CREATE': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
        case 'UPDATE': return 'bg-amber-50 text-amber-700 border border-amber-100';
        case 'DELETE': return 'bg-red-50 text-red-700 border border-red-100';
        default: return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      }
    }
    
    switch (act) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-600';
      case 'UPDATE': return 'bg-amber-100 text-amber-600';
      case 'DELETE': return 'bg-red-100 text-red-600';
      default: return 'bg-indigo-100 text-indigo-600';
    }
  }
}
