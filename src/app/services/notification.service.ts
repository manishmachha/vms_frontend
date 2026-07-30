import { Injectable, computed, signal } from '@angular/core';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';
import { AuthStore } from './auth.store';
import type { IMessage, Client, StompSubscription } from '@stomp/stompjs';
import { ActivityLog } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private stompClient: Client | null = null;
  private orgSubscription: StompSubscription | null = null;
  private globalSubscription: StompSubscription | null = null;

  // State signals
  private _notifications = signal<ActivityLog[]>([]);
  private _unreadCount = signal<number>(0);
  
  // Computed signals
  readonly notifications = computed(() => this._notifications());
  readonly unreadCount = computed(() => this._unreadCount());

  constructor(
    private api: ApiService,
    private authStore: AuthStore
  ) {
    // Request OS Notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Initial fetch if already logged in
    if (this.authStore.isAuthenticated()) {
      this.fetchInitialNotifications();
      this.connect();
    }
  }

  /**
   * Fetches the initial page of notifications via REST API
   */
  public fetchInitialNotifications() {
    const orgId = this.authStore.organizationId();
    let url = `/activities?size=50`;
    if (orgId) {
      url += `&organizationId=${orgId}`;
    }

    this.api.get<any>(url, undefined, undefined, true).subscribe({
      next: (res: any) => {
        // Assume pageable response: res.content
        // ApiService extracts .data, but if it's already extracted, res is the payload
        this._notifications.set(res.content || []);
      },
      error: (err: any) => console.error('Failed to fetch notifications', err)
    });

    this.fetchUnreadCount();
  }

  /**
   * Fetches the initial unread count via REST API
   */
  public fetchUnreadCount() {
    const orgId = this.authStore.organizationId();
    let url = `/activities/unread-count`;
    if (orgId) {
      url += `?organizationId=${orgId}`;
    }

    this.api.get<{count: number}>(url, undefined, undefined, true).subscribe({
      next: (res: any) => {
        this._unreadCount.set(res.count || 0);
      },
      error: (err: any) => console.error('Failed to fetch unread count', err)
    });
  }

  /**
   * Connects to the STOMP WebSocket broker
   */
  public async connect() {
    if (this.stompClient && this.stompClient.connected) {
      return;
    }

    const token = this.authStore.accessToken();
    if (!token) return;

    // Use absolute URL for WS if API url is relative
    const wsUrl = environment.apiUrl.startsWith('http') 
      ? environment.apiUrl.replace('http', 'ws') + '/ws'
      : window.location.protocol.replace('http', 'ws') + '//' + window.location.host + environment.apiUrl + '/ws';

    try {
      const { Client } = await import('@stomp/stompjs');

      // Fallback for environments where WebSockets aren't natively supported
      let SockJSClass: any = null;
      if (typeof WebSocket !== 'function') {
        SockJSClass = (await import('sockjs-client')).default;
      }

      this.stompClient = new Client({
        brokerURL: wsUrl,
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        debug: (str) => {
          // console.log('STOMP: ' + str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      if (SockJSClass) {
        const httpUrl = environment.apiUrl.startsWith('http') 
          ? environment.apiUrl + '/ws'
          : window.location.protocol + '//' + window.location.host + environment.apiUrl + '/ws';
          
        this.stompClient.webSocketFactory = () => {
          return new SockJSClass(httpUrl);
        };
      }

      this.stompClient.onConnect = (frame) => {
      console.log('Connected to Notifications WebSocket');
      this.subscribeToNotifications();
    };

    this.stompClient.onStompError = (frame) => {
      console.error('STOMP Error', frame.headers['message'], frame.body);
    };

      this.stompClient.activate();
    } catch (err) {
      console.error('Failed to load STOMP/SockJS', err);
    }
  }

  /**
   * Disconnects from STOMP
   */
  public disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }

  private subscribeToNotifications() {
    if (!this.stompClient || !this.stompClient.connected) return;

    const orgId = this.authStore.organizationId();

    // Subscribe to Organization Notifications
    if (orgId) {
      if (this.orgSubscription) this.orgSubscription.unsubscribe();
      
      this.orgSubscription = this.stompClient.subscribe(`/topic/notifications/org/${orgId}`, (message: IMessage) => {
        this.handleIncomingNotification(message);
      });
    }

    // Subscribe to Global Notifications
    if (this.globalSubscription) this.globalSubscription.unsubscribe();
    this.globalSubscription = this.stompClient.subscribe(`/topic/notifications/global`, (message: IMessage) => {
      this.handleIncomingNotification(message);
    });
  }

  private handleIncomingNotification(message: IMessage) {
    if (message.body) {
      try {
        const notification: ActivityLog = JSON.parse(message.body);
        
        // Update signals
        this._notifications.update(list => {
          // Prepend new notification, limit to 50
          const updated = [notification, ...list];
          return updated.slice(0, 50);
        });
        
        this._unreadCount.update(count => count + 1);

        // Spawn OS Level Notification
        if ('Notification' in window) {
          console.log('[NotificationService] Permission status:', Notification.permission);
          if (Notification.permission === 'granted') {
            console.log('[NotificationService] Spawning OS notification:', notification.message);
            const osNotification = new Notification('Solventek VMS', {
              body: notification.message || 'You have a new notification',
              icon: '/favicon.ico'
            });
            
            osNotification.onclick = function() {
              window.focus();
              this.close();
            };
          } else if (Notification.permission === 'default') {
            console.log('[NotificationService] Permission is default, attempting to request...');
            Notification.requestPermission();
          }
        }
      } catch (err) {
        console.error('Error parsing incoming notification', err);
      }
    }
  }

  /**
   * Marks a notification as read
   */
  public markAsRead(id: string) {
    this.api.put(`/activities/${id}/read`, {}, undefined, undefined, true).subscribe({
      next: () => {
        this._notifications.update(list => {
          return list.map(n => n.id === id ? { ...n, read: true } : n);
        });
        this._unreadCount.update(count => Math.max(0, count - 1));
      },
      error: (err: any) => console.error('Failed to mark notification as read', err)
    });
  }

  /**
   * Marks all notifications for a specific entity as read
   */
  public markEntityAsRead(entityType: string, entityId: string | number) {
    const unread = this._notifications().filter(n => 
      n.entityType === entityType && 
      String(n.entityId) === String(entityId) && 
      !n.read
    );

    unread.forEach(n => this.markAsRead(n.id));
  }

  /**
   * Marks all notifications as read
   */
  public markAllAsRead() {
    const orgId = this.authStore.organizationId();
    let url = `/activities/mark-all-read`;
    if (orgId) {
      url += `?organizationId=${orgId}`;
    }

    this.api.post(url, {}, undefined, true).subscribe({
      next: () => {
        this._notifications.update(list => {
          return list.map(n => ({ ...n, read: true }));
        });
        this._unreadCount.set(0);
      },
      error: (err: any) => console.error('Failed to mark all notifications as read', err)
    });
  }
}
