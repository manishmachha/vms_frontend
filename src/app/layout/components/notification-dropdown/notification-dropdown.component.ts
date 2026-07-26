import {
  Component,
  inject,
  OnInit,
  signal,
  HostListener,
  ElementRef,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Notification, NotificationService } from '../../../services/notification.service';
import { MfeNavigationService } from '../../../services/mfe-navigation.service';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.css'],
})
export class NotificationDropdownComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private elementRef = inject(ElementRef);
  private router = inject(Router);
  private mfeNav = inject(MfeNavigationService);
  private destroyRef = inject(DestroyRef);

  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  isOpen = signal(false);

  ngOnInit() {
    this.loadUnreadCount();

    // Subscribe to real-time notification stream instead of polling
    this.notificationService.notificationStream
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadUnreadCount();
        if (this.isOpen()) {
          this.loadNotifications();
        }
      });
  }

  loadUnreadCount() {
    this.notificationService.getUnreadCount(true).subscribe({
      next: (count) => this.unreadCount.set(count),
      error: () => this.unreadCount.set(0),
    });
  }

  loadNotifications() {
    this.notificationService.getNotifications(0, 10, false, true).subscribe({
      next: (page) => {
        this.notifications.set(
          page.content.map((n: any) => ({
            ...n,
            read: n.readAt != null,
          })),
        );
      },
    });
  }

  toggleDropdown() {
    this.isOpen.update((open) => !open);
    if (this.isOpen()) {
      this.loadNotifications();
    }
  }

  handleClick(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id, true).subscribe(() => {
        this.loadUnreadCount();
        notification.read = true;
      });
    }
    // Navigate if actionUrl is set
    if (notification.actionUrl) {
      this.isOpen.set(false);
      const fixedUrl = notification.actionUrl.replace(/^\/portal/, '');
      this.mfeNav.navigateByUrl(fixedUrl);
    }
  }

  markAllRead() {
    this.notificationService.markAllAsRead(true).subscribe({
      next: () => {
        this.loadNotifications();
        this.loadUnreadCount();
      },
    });
  }

  viewAll() {
    this.isOpen.set(false);
    this.mfeNav.navigate('/notifications');
  }

  getIcon(notification: Notification): string {
    return this.notificationService.getIconClass(notification);
  }

  getColorClasses(notification: Notification): string {
    const colors = this.notificationService.getColorClass(notification);
    return `${colors.bg} ${colors.text}`;
  }

  getPriorityClass(priority: string): string {
    return this.notificationService.getPriorityClass(priority);
  }

  getRelativeTime(dateStr: string): string {
    return this.notificationService.getRelativeTime(dateStr);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
