import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TimesheetService } from '../../services/timesheet.service';
import { Timesheet, UpdateTimesheetStatusRequest, TimesheetStatus } from '../../models/timesheet.model';
import { HeaderService } from '../../../services/header.service';
import { AuthStore } from '../../../services/auth.store';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-timesheet-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './timesheet-detail.component.html',
})
export class TimesheetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  timesheetService = inject(TimesheetService);
  headerService = inject(HeaderService);
  authStore = inject(AuthStore);
  private snackBar = inject(MatSnackBar);

  timesheet = signal<Timesheet | null>(null);
  managerNotes = signal('');

  ngOnInit() {
    this.headerService.setTitle('Timesheet Details', 'Review timesheet information', 'bi bi-clock-history');
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTimesheet(id);
    }
  }

  loadTimesheet(id: string) {
    this.timesheetService.getTimesheetById(id).subscribe({
      next: (data) => {
        this.timesheet.set(data);
        this.managerNotes.set(data.managerNotes || '');
      },
      error: () => this.snackBar.open('Failed to load timesheet', 'Close', { duration: 3000 })
    });
  }

  updateStatus(status: TimesheetStatus) {
    const ts = this.timesheet();
    if (!ts) return;

    const data: UpdateTimesheetStatusRequest = {
      status,
      managerNotes: this.managerNotes()
    };

    this.timesheetService.updateStatus(ts.id, data).subscribe({
      next: (updated) => {
        this.timesheet.set(updated);
        this.snackBar.open(`Timesheet ${status.toLowerCase()}`, 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to update status', 'Close', { duration: 3000 })
    });
  }

  downloadInvoice() {
    const ts = this.timesheet();
    if (!ts || !ts.invoiceOriginalFileName) return;

    this.timesheetService.downloadInvoice(ts.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = ts.invoiceOriginalFileName!;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Failed to download invoice', 'Close', { duration: 3000 })
    });
  }
}
