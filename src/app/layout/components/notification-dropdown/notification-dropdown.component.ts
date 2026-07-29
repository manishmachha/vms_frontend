import { Component, HostListener, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { MfeNavigationService } from '../../../services/mfe-navigation.service';
import { ActivityLog } from '../../../models/notification.model';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="relative">
      <!-- Toggle Button -->
      <button 
        #toggleBtn
        (click)="toggle()"
        class="relative p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <i class="bi bi-bell text-xl"></i>
        <span *ngIf="notificationService.unreadCount() > 0" 
              class="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
          {{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}
        </span>
      </button>

      <!-- Dropdown Panel -->
      <div 
        #dropdown
        *ngIf="isOpen"
        class="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden flex flex-col"
      >
        <!-- Header -->
        <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 class="text-sm font-semibold text-gray-900">Notifications</h3>
          <a [routerLink]="mfeNav.basePath + '/notifications'" (click)="isOpen = false" class="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            View All
          </a>
        </div>

        <!-- List -->
        <div class="max-h-[400px] overflow-y-auto">
          <div *ngIf="notificationService.notifications().length === 0" class="py-8 text-center text-sm text-gray-500">
            No notifications yet
          </div>
          
          <a *ngFor="let notif of notificationService.notifications()" 
             (click)="handleNotificationClick(notif)"
             class="block px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer relative"
             [class.bg-indigo-50]="!notif.read">
            <div class="flex gap-3">
              <!-- Icon -->
              <div class="flex-shrink-0 mt-1">
                <div class="h-8 w-8 rounded-full flex items-center justify-center" [ngClass]="getIconBgClass(notif.entityType)">
                  <i class="bi text-white text-sm" [ngClass]="getIconClass(notif.entityType)"></i>
                </div>
              </div>
              
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900 font-medium break-words leading-snug">
                  {{ notif.message }}
                </p>
                <div class="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span>{{ formatTime(notif.timestamp) }}</span>
                  <span *ngIf="notif.actorEmail" class="truncate opacity-75">&bull; by {{ notif.actorEmail }}</span>
                </div>
              </div>
              
              <!-- Unread Indicator -->
              <div *ngIf="!notif.read" class="flex-shrink-0 self-center">
                <div class="h-2 w-2 bg-indigo-600 rounded-full"></div>
              </div>
            </div>
          </a>
        </div>
        
        <!-- Footer -->
        <div class="border-t border-gray-100 bg-gray-50/50 p-2 text-center" *ngIf="notificationService.notifications().length > 0">
          <button (click)="markAllAsRead()" class="text-xs font-medium text-gray-500 hover:text-gray-700">Mark all as read</button>
        </div>
      </div>
    </div>
  `
})
export class NotificationDropdownComponent {
  notificationService = inject(NotificationService);
  mfeNav = inject(MfeNavigationService);
  router = inject(Router);
  
  isOpen = false;

  @ViewChild('dropdown') dropdownRef!: ElementRef;
  @ViewChild('toggleBtn') toggleBtnRef!: ElementRef;

  toggle() {
    this.isOpen = !this.isOpen;
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (this.isOpen && 
        this.dropdownRef && 
        !this.dropdownRef.nativeElement.contains(event.target) &&
        !this.toggleBtnRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  handleNotificationClick(notification: ActivityLog) {
    this.notificationService.markAsRead(notification.id);
    this.isOpen = false;
    
    // Navigate based on entity type
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
      case 'INTERVIEW': return `/interviews`; // or tracking
      case 'TICKET': return `/tickets/${id}`;
      case 'APPLICATION': return `/applications/${id}`;
      case 'SUBMISSION': return `/applications`; // or specific submission route if it exists
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
