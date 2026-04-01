import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css'],
})
export class TimelineComponent {
  @Input() events: any[] = [];
  @Input() entityType?: string;
  @Input() entityId?: string | number;

  getEventIcon(action: string): string {
    const a = action?.toUpperCase();
    if (a.includes('CREATE') || a.includes('APPLY')) return 'add_circle';
    if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('STATUS')) return 'edit_note';
    if (a.includes('DELETE') || a.includes('REMOVE') || a.includes('ARCHIVE')) return 'delete_outline';
    if (a.includes('INTERVIEW')) return 'event';
    if (a.includes('PROJECT') || a.includes('ALLOCATE')) return 'assignment_ind';
    if (a.includes('DOCUMENT') || a.includes('UPLOAD')) return 'description';
    if (a.includes('FEEDBACK') || a.includes('COMMENT')) return 'chat_bubble_outline';
    if (a.includes('PUBLISH') || a.includes('APPROVE')) return 'task_alt';
    return 'history';
  }

  getEventColor(action: string): string {
    const a = action?.toUpperCase();
    if (a.includes('CREATE') || a.includes('APPLY') || a.includes('PUBLISH')) return 'bg-green-500';
    if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('STATUS')) return 'bg-blue-500';
    if (a.includes('DELETE') || a.includes('REMOVE') || a.includes('ARCHIVE')) return 'bg-red-500';
    if (a.includes('INTERVIEW')) return 'bg-indigo-500';
    if (a.includes('PROJECT') || a.includes('ALLOCATE')) return 'bg-purple-500';
    if (a.includes('DOCUMENT') || a.includes('UPLOAD')) return 'bg-amber-500';
    return 'bg-gray-500';
  }
}
