import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NotificationService } from './notification.service';
import { DOCUMENT } from '@angular/common';

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
  private document = inject(DOCUMENT);

  private previousUnreadCount = 0;
  private flashInterval: any = null;
  private isAltState = false;

  private originalFaviconUrl: string | null = null;
  private badgedFaviconUrl: string = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23ef4444' d='M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z'/%3E%3C/svg%3E";

  private flashTitle: string = '';
  private flashCount: number = 0;

  constructor() {
    this.initFavicons();

    effect(() => {
      const currentTitle = this.title();
      const unreadCount = this.notificationService.unreadCount();

      if (unreadCount > 0) {
        this.startFlashing(currentTitle, unreadCount);
      } else {
        this.stopFlashing();
        this.updateStaticState(currentTitle, unreadCount);
      }
    });
  }

  private getFaviconLink(): HTMLLinkElement | null {
    if (typeof document === 'undefined') return null;
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    return link;
  }

  private initFavicons() {
    if (typeof document === 'undefined') return;
    const link = this.getFaviconLink();
    if (!link) return;
    
    this.originalFaviconUrl = link.href || '/favicon.ico';
    // We now use a pre-defined SVG red bell for the badged url
  }

  private setFavicon(url: string | null) {
    if (!url) return;
    const link = this.getFaviconLink();
    if (link && link.href !== url) {
      link.href = url;
    }
  }

  private updateStaticState(currentTitle: string, unreadCount: number) {
    if (unreadCount > 0) {
      this.titleService.setTitle(`(${unreadCount}) ${currentTitle} | Solventek VMS`);
      this.setFavicon(this.badgedFaviconUrl || this.originalFaviconUrl);
    } else {
      this.titleService.setTitle(`${currentTitle} | Solventek VMS`);
      this.setFavicon(this.originalFaviconUrl);
    }
  }

  private startFlashing(currentTitle: string, unreadCount: number) {
    // Update the instance variables so the interval picks up new titles/counts immediately
    this.flashTitle = currentTitle;
    this.flashCount = unreadCount;

    if (this.flashInterval) return; // Already flashing
    
    let tick = 0;
    this.flashInterval = setInterval(() => {
      tick++;
      
      // Icon blinks 3 times per second (toggle every ~167ms)
      if (tick % 2 === 0) {
        this.setFavicon(this.badgedFaviconUrl || this.originalFaviconUrl);
      } else {
        this.setFavicon(this.originalFaviconUrl);
      }

      // Title blinks every ~1.5s (9 ticks)
      if (Math.floor(tick / 9) % 2 === 0) {
        this.titleService.setTitle(`(${this.flashCount}) New Notification!`);
      } else {
        this.titleService.setTitle(`(${this.flashCount}) ${this.flashTitle} | Solventek VMS`);
      }
    }, 167);
  }

  private stopFlashing() {
    if (this.flashInterval) {
      clearInterval(this.flashInterval);
      this.flashInterval = null;
      this.isAltState = false;
      // Reset to static state immediately
      this.updateStaticState(this.title(), this.notificationService.unreadCount());
    }
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
