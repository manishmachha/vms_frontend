import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Client, StompSubscription, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthStore } from './auth.store';
import { ActivityLog } from '../models/notification.model';
import { SKIP_LOADER } from './api.service';

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
    private http: HttpClient,
    private authStore: AuthStore
  ) {
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
    let url = `${environment.apiUrl}/activities?size=50`;
    if (orgId) {
      url += `&organizationId=${orgId}`;
    }

    const context = new HttpContext().set(SKIP_LOADER, true);
    this.http.get<any>(url, { context }).subscribe({
      next: (res) => {
        // Assume pageable response: res.content
        this._notifications.set(res.content || []);
      },
      error: (err) => console.error('Failed to fetch notifications', err)
    });

    this.fetchUnreadCount();
  }

  /**
   * Fetches the initial unread count via REST API
   */
  public fetchUnreadCount() {
    const orgId = this.authStore.organizationId();
    let url = `${environment.apiUrl}/activities/unread-count`;
    if (orgId) {
      url += `?organizationId=${orgId}`;
    }

    const context = new HttpContext().set(SKIP_LOADER, true);
    this.http.get<{count: number}>(url, { context }).subscribe({
      next: (res) => {
        this._unreadCount.set(res.count || 0);
      },
      error: (err) => console.error('Failed to fetch unread count', err)
    });
  }

  /**
   * Connects to the STOMP WebSocket broker
   */
  public connect() {
    if (this.stompClient && this.stompClient.connected) {
      return;
    }

    const token = this.authStore.accessToken();
    if (!token) return;

    // Use absolute URL for WS if API url is relative
    const wsUrl = environment.apiUrl.startsWith('http') 
      ? environment.apiUrl.replace('http', 'ws') + '/ws'
      : window.location.protocol.replace('http', 'ws') + '//' + window.location.host + environment.apiUrl + '/ws';

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

    // Fallback for environments where WebSockets aren't natively supported
    if (typeof WebSocket !== 'function') {
      const httpUrl = environment.apiUrl.startsWith('http') 
        ? environment.apiUrl + '/ws'
        : window.location.origin + environment.apiUrl + '/ws';
        
      this.stompClient.webSocketFactory = () => {
        return new (SockJS as any)(httpUrl);
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
        
      } catch (err) {
        console.error('Error parsing incoming notification', err);
      }
    }
  }

  /**
   * Marks a notification as read
   */
  public markAsRead(id: string) {
    const context = new HttpContext().set(SKIP_LOADER, true);
    this.http.put(`${environment.apiUrl}/activities/${id}/read`, {}, { context }).subscribe({
      next: () => {
        this._notifications.update(list => {
          return list.map(n => n.id === id ? { ...n, read: true } : n);
        });
        this._unreadCount.update(count => Math.max(0, count - 1));
      },
      error: (err) => console.error('Failed to mark notification as read', err)
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
    let url = `${environment.apiUrl}/activities/mark-all-read`;
    if (orgId) {
      url += `?organizationId=${orgId}`;
    }

    const context = new HttpContext().set(SKIP_LOADER, true);
    this.http.post(url, {}, { context }).subscribe({
      next: () => {
        this._notifications.update(list => {
          return list.map(n => ({ ...n, read: true }));
        });
        this._unreadCount.set(0);
      },
      error: (err) => console.error('Failed to mark all notifications as read', err)
    });
  }
}
