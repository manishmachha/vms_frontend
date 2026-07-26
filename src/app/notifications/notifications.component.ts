import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, Notification } from '../services/notification.service';
import { HeaderService } from '../services/header.service';
import { MfeNavigationService } from '../services/mfe-navigation.service';

interface GroupedNotifications {
  label: string;
  notifications: Notification[];
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private headerService = inject(HeaderService);
  private router = inject(Router);
  private mfeNav = inject(MfeNavigationService);
  private destroyRef = inject(DestroyRef);

  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);

  activeFilter: 'all' | 'unread' = 'all';
  filters = [
    { label: 'All', value: 'all' as const },
    { label: 'Unread', value: 'unread' as const },
  ];

  currentPage = 0;
  pageSize = 20;
  hasMore = false;
  hasReadNotifications = false;

  ngOnInit() {
    this.headerService.setTitle(
      'Notifications',
      'Stay updated on all your activities',
      'bi bi-bell',
    );
    this.loadNotifications();
    this.loadUnreadCount();

    // Subscribe to live updates
    this.notificationService.notificationStream
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadNotifications();
        this.loadUnreadCount();
      });
  }

  loadNotifications() {
    this.currentPage = 0;
    const unreadOnly = this.activeFilter === 'unread';

    this.notificationService
      .getNotifications(this.currentPage, this.pageSize, unreadOnly)
      .subscribe({
        next: (page) => {
          const mapped = page.content.map((n: any) => ({
            ...n,
            read: n.readAt != null,
          }));
          this.notifications.set(mapped);
          this.hasMore = !page.last;
          this.hasReadNotifications = mapped.some((n: any) => n.read);
        },
      });
  }

  loadMore() {
    this.currentPage++;
    const unreadOnly = this.activeFilter === 'unread';

    this.notificationService
      .getNotifications(this.currentPage, this.pageSize, unreadOnly)
      .subscribe({
        next: (page) => {
          const mapped = page.content.map((n: any) => ({
            ...n,
            read: n.readAt != null,
          }));
          this.notifications.update((current) => [...current, ...mapped]);
          this.hasMore = !page.last;
        },
      });
  }

  loadUnreadCount() {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => this.unreadCount.set(count),
    });
  }

  groupedNotifications(): GroupedNotifications[] {
    const groups: Map<string, Notification[]> = new Map();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    for (const n of this.notifications()) {
      const date = new Date(n.createdAt);
      let label: string;

      if (date >= today) {
        label = 'Today';
      } else if (date >= yesterday) {
        label = 'Yesterday';
      } else if (date >= weekAgo) {
        label = 'This Week';
      } else {
        label = 'Older';
      }

      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)!.push(n);
    }

    const order = ['Today', 'Yesterday', 'This Week', 'Older'];
    return order
      .filter((label) => groups.has(label))
      .map((label) => ({ label, notifications: groups.get(label)! }));
  }

  handleClick(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        this.loadUnreadCount();
        notification.read = true;
      });
    }
    // Navigate if actionUrl is set
    if (notification.actionUrl) {
      const fixedUrl = notification.actionUrl.replace(/^\/portal/, '');
      this.mfeNav.navigateByUrl(fixedUrl);
    }
  }

  markAsRead(notification: Notification, event: Event) {
    event.stopPropagation();
    this.notificationService.markAsRead(notification.id).subscribe(() => {
      notification.read = true;
      this.loadUnreadCount();
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
      this.unreadCount.set(0);
    });
  }

  deleteNotification(notification: Notification, event: Event) {
    event.stopPropagation();
    this.notificationService.deleteNotification(notification.id).subscribe(() => {
      this.notifications.update((list) => list.filter((n) => n.id !== notification.id));
      if (!notification.read) {
        this.loadUnreadCount();
      }
    });
  }

  deleteAllRead() {
    this.notificationService.deleteAllRead().subscribe(() => {
      this.notifications.update((list) => list.filter((n) => !n.read));
      this.hasReadNotifications = false;
    });
  }

  getIcon(n: Notification): string {
    return this.notificationService.getIconClass(n);
  }

  getColorClasses(n: Notification): string {
    const colors = this.notificationService.getColorClass(n);
    return `${colors.bg} ${colors.text}`;
  }

  getPriorityClass(priority: string): string {
    return this.notificationService.getPriorityClass(priority);
  }

  getRelativeTime(dateStr: string): string {
    return this.notificationService.getRelativeTime(dateStr);
  }
}
