import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NotificationService } from './notification.service';

export interface HeaderState {
  title: string;
  subtitle?: string;
  icon?: string; // class name for bootstrap/material icon
}

@Injectable({
  providedIn: 'root',
})
export class HeaderService {
  private state = signal<HeaderState>({
    title: 'VMS',
    subtitle: 'Enterprise Portal',
    icon: 'bi bi-wind',
  });

  readonly title = computed(() => this.state().title);
  readonly subtitle = computed(() => this.state().subtitle);
  readonly icon = computed(() => this.state().icon);

  private titleService = inject(Title);
  private notificationService = inject(NotificationService);

  constructor() {
    effect(() => {
      const currentTitle = this.title();
      const unreadCount = this.notificationService.unreadCount();
      
      if (unreadCount > 0) {
        this.titleService.setTitle(`(${unreadCount}) ${currentTitle} | Solventek VMS`);
      } else {
        this.titleService.setTitle(`${currentTitle} | Solventek VMS`);
      }
    });
  }

  setTitle(title: string, subtitle?: string, icon?: string) {
    this.state.set({ title, subtitle, icon });
  }

  reset() {
    this.state.set({
      title: 'VMS',
      subtitle: 'Enterprise Portal',
      icon: 'bi bi-wind',
    });
  }
}
