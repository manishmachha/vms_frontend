import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div *ngFor="let event of events" class="flex gap-3">
        <div class="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
        <div>
          <p class="text-sm font-medium text-gray-900">{{ event.action || event.description }}</p>
          <p class="text-xs text-gray-500">{{ event.createdAt | date: 'short' }}</p>
        </div>
      </div>
      <div *ngIf="!events || events.length === 0" class="text-sm text-gray-400 text-center py-4">
        No timeline events
      </div>
    </div>
  `,
})
export class TimelineComponent {
  @Input() events: any[] = [];
  @Input() entityType?: string;
  @Input() entityId?: string | number;
}
