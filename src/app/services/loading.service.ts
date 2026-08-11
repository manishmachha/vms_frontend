import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private static nextId = 1;
  public id = LoadingService.nextId++;
  private activeRequests = signal(0);

  constructor() {
    console.log(`[LoadingService] Created instance #${this.id}`);
  }

  // Expose loading state as a signal
  readonly isLoading = computed(() => {
    const loading = this.activeRequests() > 0;
    console.log(`[LoadingService #${this.id}] isLoading checked:`, loading, `(active: ${this.activeRequests()})`);
    return loading;
  });

  show() {
    this.activeRequests.update((count) => {
      const next = count + 1;
      console.log(`[LoadingService #${this.id}] show() called. Active requests: ${next}`);
      return next;
    });
  }

  hide() {
    setTimeout(() => {
      this.activeRequests.update((count) => {
        const next = Math.max(0, count - 1);
        console.log(`[LoadingService #${this.id}] hide() called. Active requests: ${next}`);
        return next;
      });
    });
  }
}
