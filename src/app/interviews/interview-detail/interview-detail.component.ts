import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InterviewService } from '../../services/interview.service';
import { Interview } from '../../models/interview.model';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HeaderService } from '../../services/header.service';
import { ScheduleInterviewDialogComponent } from '../../applications/dialogs/schedule-interview-dialog/schedule-interview-dialog.component';
import { SubmitFeedbackDialogComponent } from '../dialogs/submit-feedback-dialog/submit-feedback-dialog.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-interview-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './interview-detail.component.html',
  styleUrls: ['./interview-detail.component.css'],
})
export class InterviewDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private interviewService = inject(InterviewService);
  private headerService = inject(HeaderService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  interview = signal<Interview | null>(null);

  ngOnInit() {
    this.headerService.setTitle(
      'Interview Details',
      'Review interview details',
      'bi bi-calendar-check',
    );
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadInterview(params['id']);
      }
    });
  }

  loadInterview(id: number) {
    this.interviewService.getInterviewById(id).subscribe({
      next: (res) => {
        this.interview.set(res || null);
      },
      error: () => this.interview.set(null)
    });
  }

  getStatusClass(interview: Interview): string {
    switch (interview.status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border border-red-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  }

  openEditDialog() {
    const interview = this.interview();
    if (!interview) return;

    this.dialog.open(ScheduleInterviewDialogComponent, {
      width: '600px',
      data: { 
        interview,
        applicationId: interview.application?.id,
        candidateName: `${interview.application?.candidate?.firstName} ${interview.application?.candidate?.lastName}`,
        jobTitle: interview.application?.job?.title
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.loadInterview(interview.id);
        this.snackBar.open('Interview updated successfully', 'Close', { duration: 3000 });
      }
    });
  }

  openFeedbackDialog() {
    const interview = this.interview();
    if (!interview) return;

    this.dialog.open(SubmitFeedbackDialogComponent, {
      width: '500px',
      data: { interview }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.loadInterview(interview.id);
        this.snackBar.open('Feedback submitted successfully', 'Close', { duration: 3000 });
      }
    });
  }

  requestFeedback() {
    const interview = this.interview();
    if (!interview) return;

    this.interviewService.requestFeedback(interview.id).subscribe({
      next: () => {
        this.snackBar.open('Feedback request sent to interviewer', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Failed to request feedback', err);
        this.snackBar.open('Failed to send feedback request', 'Close', { duration: 3000 });
      }
    });
  }
}
