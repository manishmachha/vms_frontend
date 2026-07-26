import { Injectable, inject, signal, NgZone } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Page } from '../models/page.model';
import { ApiResponse } from '../models/auth.model';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { AuthStore } from './auth.store';
import { Client, IMessage } from '@stomp/stompjs';

export interface Notification {
  id: number;
  title: string;
  body: string;
  category: string;
  priority: string;
  refEntityType: string;
  refEntityId: number;
  actionUrl: string;
  iconType: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationCounts {
  [key: string]: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiService = inject(ApiService);
  private authStore = inject(AuthStore);
  private zone = inject(NgZone);
  private baseUrl = `/notifications`;
  
  private stompClient: Client | null = null;
  readonly notificationStream = new Subject<Notification>();

  // Centralized signal for notification counts
  readonly notificationCounts = signal<NotificationCounts | null>(null);

  constructor() {
    this.connectWebSocket();
  }

  private connectWebSocket() {
    const token = this.authStore.accessToken();
    if (!token) return;

    // Use environment apiUrl to build WS url, fallback to standard localhost
    let wsUrl = (environment.apiUrl || 'http://localhost:8080/api').replace(/^http/, 'ws') + '/ws';
    
    this.stompClient = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => {
      console.log('Connected to Real-time Notifications');
      this.zone.run(() => {
        this.refreshCounts();
      });
      
      this.stompClient?.subscribe('/user/queue/notifications', (message: IMessage) => {
        console.log('[WebSocket] Received message:', message.body);
        if (message.body) {
          const notification: Notification = JSON.parse(message.body);
          this.zone.run(() => {
            console.log('[WebSocket] Processing notification:', notification);
            this.notificationStream.next(notification);
            this.refreshCounts();
          });
        }
      });
    };

    this.stompClient.activate();
  }

  refreshCounts() {
    this.getCountByCategory(true).subscribe({
      next: (counts) => this.notificationCounts.set(counts),
      error: () => this.notificationCounts.set(null),
    });
  }

  getNotifications(
    page: number = 0,
    size: number = 10,
    unreadOnly: boolean = false,
    skipLoading: boolean = false,
  ) {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('unreadOnly', unreadOnly);
    
    return this.apiService.get<Page<Notification>>(this.baseUrl, params, undefined, skipLoading);
  }

  getNotificationsByCategory(
    category: string,
    page: number = 0,
    size: number = 20,
    skipLoading: boolean = false,
  ) {
    let params = new HttpParams().set('page', page).set('size', size);
    return this.apiService.get<Page<Notification>>(`${this.baseUrl}/category/${category}`, params, undefined, skipLoading);
  }

  getUnreadCount(skipLoading: boolean = false) {
    return this.apiService.get<number>(`${this.baseUrl}/unread-count`, undefined, undefined, skipLoading);
  }

  getCountByCategory(skipLoading: boolean = false) {
    return this.apiService.get<NotificationCounts>(`${this.baseUrl}/count-by-category`, undefined, undefined, skipLoading);
  }

  getUnreadEntityIds(category: string) {
    return this.apiService.get<number[]>(`${this.baseUrl}/unread-entity-ids/${category}`);
  }

  markAsRead(id: number | string, skipLoading: boolean = false) {
    return this.apiService.post<void>(`${this.baseUrl}/${id}/read`, {}, undefined, skipLoading);
  }

  markAsReadByEntity(category: string, entityId: number | string, skipLoading: boolean = false) {
    return this.apiService.post<number>(`${this.baseUrl}/read/entity/${category}/${entityId}`, {}, undefined, skipLoading);
  }

  markAllAsRead(skipLoading: boolean = false) {
    return this.apiService.post<number>(`${this.baseUrl}/mark-all-read`, {}, undefined, skipLoading);
  }

  deleteNotification(id: number | string) {
    return this.apiService.delete<void>(`${this.baseUrl}/${id}`);
  }

  deleteAllRead() {
    return this.apiService.delete<number>(`${this.baseUrl}/read`);
  }

  // Helper to get icon class based on category
  getIconClass(notification: Notification): string {
    if (notification.iconType) return notification.iconType;

    switch (notification.category) {
      case 'APPLICATION':
        return 'bi-file-earmark-text-fill';
      case 'JOB':
        return 'bi-briefcase-fill';
      case 'TICKET':
        return 'bi-ticket-detailed-fill';
      case 'USER':
        return 'bi-person-fill';
      case 'ORGANIZATION':
        return 'bi-building-fill';
      case 'PROJECT':
        return 'bi-kanban-fill';
      case 'INTERVIEW':
        return 'bi-calendar-event-fill';
      case 'ONBOARDING':
        return 'bi-person-check-fill';
      case 'ANALYSIS':
        return 'bi-robot';
      case 'TRACKING':
        return 'bi-list-check';
      default:
        return 'bi-bell-fill';
    }
  }

  // Helper to get color class based on category
  getColorClass(notification: Notification): { bg: string; text: string } {
    switch (notification.category) {
      case 'APPLICATION':
        return { bg: 'bg-blue-100', text: 'text-blue-600' };
      case 'JOB':
        return { bg: 'bg-purple-100', text: 'text-purple-600' };
      case 'TICKET':
        return { bg: 'bg-amber-100', text: 'text-amber-600' };
      case 'USER':
        return { bg: 'bg-green-100', text: 'text-green-600' };
      case 'ORGANIZATION':
        return { bg: 'bg-indigo-100', text: 'text-indigo-600' };
      case 'PROJECT':
        return { bg: 'bg-pink-100', text: 'text-pink-600' };
      case 'INTERVIEW':
        return { bg: 'bg-cyan-100', text: 'text-cyan-600' };
      case 'ONBOARDING':
        return { bg: 'bg-teal-100', text: 'text-teal-600' };
      case 'ANALYSIS':
        return { bg: 'bg-violet-100', text: 'text-violet-600' };
      case 'TRACKING':
        return { bg: 'bg-fuchsia-100', text: 'text-fuchsia-600' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600' };
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'NORMAL':
        return 'bg-gray-200 text-gray-700';
      case 'LOW':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  }

  getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}
