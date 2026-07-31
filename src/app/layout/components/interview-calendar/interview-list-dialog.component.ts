import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { Interview } from '../../../models/interview.model';
import { MfeNavigationService } from '../../../services/mfe-navigation.service';

@Component({
  selector: 'app-interview-list-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, RouterModule],
  templateUrl: './interview-list-dialog.component.html',
})
export class InterviewListDialogComponent {
  private mfeNav = inject(MfeNavigationService);
  private dialogRef = inject(MatDialogRef<InterviewListDialogComponent>);
  private router = inject(Router);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { date: Date, interviews: Interview[] }) {}

  resolvePath(path: string): string {
    const base = this.mfeNav.basePath;
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  navigateToInterview(id: string | number) {
    const path = this.resolvePath('/interviews/' + id);
    this.router.navigateByUrl(path).then(() => {
      this.dialogRef.close();
    });
  }
}
