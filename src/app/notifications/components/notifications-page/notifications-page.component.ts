import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { MfeNavigationService } from '../../../services/mfe-navigation.service';
import { ActivityLog } from '../../../models/notification.model';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Notifications</h1>
          <p class="mt-1 text-sm text-gray-500">Stay up to date with activity across your organization.</p>
        </div>
        <div class="mt-4 sm:mt-0 flex gap-3">
          <button 
            *ngIf="notificationService.unreadCount() > 0"
            (click)="markAllAsRead()"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <i class="bi bi-check2-all text-lg"></i> Mark all as read
          </button>
        </div>
      </div>

      <!-- Filters (Placeholder for later) -->
      <div class="flex gap-2 mb-6 border-b border-gray-200 pb-4">
        <button class="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg">All</button>
        <button class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Unread</button>
      </div>

      <!-- Notifications List -->
      <div class="bg-white shadow ring-1 ring-black ring-opacity-5 rounded-xl overflow-hidden">
        <div *ngIf="notificationService.notifications().length === 0" class="py-12 text-center">
          <i class="bi bi-bell-slash text-4xl text-gray-300 mb-3 block"></i>
          <h3 class="text-sm font-medium text-gray-900">No notifications</h3>
          <p class="mt-1 text-sm text-gray-500">You're all caught up!</p>
        </div>

        <ul class="divide-y divide-gray-200">
          <li *ngFor="let notif of notificationService.notifications()" 
              class="relative hover:bg-gray-50 transition-colors"
              [class.bg-indigo-50]="!notif.read">
            <div class="px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <!-- Icon -->
                  <div class="flex-shrink-0">
                    <div class="h-10 w-10 rounded-full flex items-center justify-center shadow-sm" [ngClass]="getIconBgClass(notif.entityType)">
                      <i class="bi text-white text-lg" [ngClass]="getIconClass(notif.entityType)"></i>
                    </div>
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 cursor-pointer hover:text-indigo-600 truncate" (click)="handleNotificationClick(notif)">
                      {{ notif.message }}
                    </p>
                    <p class="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <i class="bi bi-clock"></i> {{ formatTime(notif.timestamp) }}
                      <span *ngIf="notif.actorEmail" class="ml-2">&bull; by {{ notif.actorEmail }}</span>
                      <span class="ml-2 px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600">
                        {{ notif.entityType }}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div class="ml-4 flex-shrink-0 flex items-center gap-3">
                  <span *ngIf="!notif.read" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    New
                  </span>
                  <button (click)="handleNotificationClick(notif)" class="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    View <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  `
})
export class NotificationsPageComponent {
  notificationService = inject(NotificationService);
  mfeNav = inject(MfeNavigationService);

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }

  handleNotificationClick(notification: ActivityLog) {
    this.notificationService.markAsRead(notification.id);
    
    const path = this.getRouteForEntity(notification.entityType, notification.entityId);
    if (path) {
      this.mfeNav.navigate(path);
    }
  }

  getRouteForEntity(type: string, id: string): string | null {
    switch(type) {
      case 'JOB': return `/jobs/${id}`;
      case 'CANDIDATE': return `/candidates/${id}`;
      case 'PROJECT': return `/projects/${id}`;
      case 'INTERVIEW': return `/interviews`;
      case 'TICKET': return `/tickets/${id}`;
      case 'APPLICATION': return `/applications/${id}`;
      case 'SUBMISSION': return `/applications`;
      case 'CLIENT': return `/clients/${id}`;
      case 'TIMESHEET_ENTRY': return `/timesheets`;
      default: return null;
    }
  }

  getIconClass(type: string): string {
    switch(type) {
      case 'JOB': return 'bi-briefcase-fill';
      case 'CANDIDATE': return 'bi-person-badge-fill';
      case 'PROJECT': return 'bi-kanban-fill';
      case 'INTERVIEW': return 'bi-calendar-event-fill';
      case 'TICKET': return 'bi-ticket-fill';
      case 'APPLICATION': 
      case 'SUBMISSION': return 'bi-file-earmark-person-fill';
      case 'CLIENT': return 'bi-building-fill';
      case 'TIMESHEET_ENTRY': return 'bi-clock-history';
      default: return 'bi-bell-fill';
    }
  }

  getIconBgClass(type: string): string {
    switch(type) {
      case 'JOB': return 'bg-blue-500';
      case 'CANDIDATE': return 'bg-emerald-500';
      case 'PROJECT': return 'bg-indigo-500';
      case 'INTERVIEW': return 'bg-purple-500';
      case 'TICKET': return 'bg-orange-500';
      case 'APPLICATION': 
      case 'SUBMISSION': return 'bg-teal-500';
      case 'CLIENT': return 'bg-sky-500';
      case 'TIMESHEET_ENTRY': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }
}
