import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-notification-dot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="hasUnread()" 
         [class]="'bg-red-500 rounded-full border-2 border-white shadow-sm animate-pulse z-20 ' + cssClass()"
         title="New activity">
    </div>
  `
})
export class NotificationDotComponent {
  entityType = input.required<string | string[]>();
  entityId = input.required<string | number>();
  cssClass = input<string>('absolute -top-1.5 -right-1.5 w-3.5 h-3.5');
  
  private notificationService = inject(NotificationService);
  
  hasUnread = computed(() => {
    const type = this.entityType();
    const id = this.entityId();
    if (!type || !id) return false;
    const types = Array.isArray(type) ? type : [type];
    return this.notificationService.notifications().some(n => 
      types.includes(n.entityType) && 
      String(n.entityId) === String(id) && 
      !n.read
    );
  });
}
