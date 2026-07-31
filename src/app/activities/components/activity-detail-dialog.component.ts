import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivityLog } from '../services/activity.service';

@Component({
  selector: 'app-activity-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './activity-detail-dialog.component.html'
})
export class ActivityDetailDialogComponent {
  public data: { activity: ActivityLog } = inject(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<ActivityDetailDialogComponent>);

  getActionIcon(action: string): string {
    switch(action?.toUpperCase()) {
      case 'CREATE': return 'add_circle';
      case 'UPDATE': return 'edit';
      case 'DELETE': return 'delete';
      default: return 'info';
    }
  }

  getActionColorClass(action: string): string {
    switch(action?.toUpperCase()) {
      case 'CREATE': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      case 'UPDATE': return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'DELETE': return 'text-red-500 bg-red-50 border-red-200';
      default: return 'text-indigo-500 bg-indigo-50 border-indigo-200';
    }
  }
}
