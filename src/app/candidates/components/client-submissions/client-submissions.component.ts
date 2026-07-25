import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  ClientSubmissionService,
  ClientSubmission,
  ClientSubmissionStatus,
} from '../../../services/client-submission.service';
import { ClientService } from '../../../services/client.service';
import { Client } from '../../../models/client.model';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../services/auth.store';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from '../../../services/dialog.service';
import { AddClientSubmissionDialogComponent } from '../../dialogs/add-client-submission-dialog/add-client-submission-dialog.component';

@Component({
  selector: 'app-client-submissions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatMenuModule,
    MatIconModule,
  ],
  templateUrl: './client-submissions.component.html',
  styleUrls: ['./client-submissions.component.css'],
})
export class ClientSubmissionsComponent implements OnInit {
  @Input() candidateId!: string | number;
  @Input() jobId?: string | number; // Optional Job ID to filter

  private submissionService = inject(ClientSubmissionService);
  private clientService = inject(ClientService);
  private authStore = inject(AuthStore);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private dialogService = inject(DialogService);

  submissions = signal<ClientSubmission[]>([]);
  activeSubmissionId = signal<number | null>(null);
  comments = signal<any[]>([]);
  newCommentText = '';
  clients = signal<Client[]>([]);

  // Permissions: Vendor cannot edit
  canEditStatus = this.authStore.orgType() !== 'VENDOR';

  // Enum Options
  allStatuses: ClientSubmissionStatus[] = [
    'SUBMITTED',
    'CLIENT_SCREENING',
    'CLIENT_INTERVIEW',
    'CLIENT_OFFERED',
    'CLIENT_REJECTED',
    'ONBOARDING',
    'WITHDRAWN',
  ];

  timelineSteps = [
    { label: 'Submitted', status: 'SUBMITTED' },
    { label: 'Screening', status: 'CLIENT_SCREENING' },
    { label: 'Interview', status: 'CLIENT_INTERVIEW' },
    { label: 'Offer', status: 'CLIENT_OFFERED' },
  ];

  ngOnInit() {
    if (this.candidateId) {
      this.loadSubmissions();
    }
    this.loadClients();
  }

  toggleComments(submissionId: number) {
    if (this.activeSubmissionId() === submissionId) {
      this.activeSubmissionId.set(null);
      this.comments.set([]);
    } else {
      this.activeSubmissionId.set(submissionId);
      this.loadComments(submissionId);
    }
  }

  loadComments(submissionId: number) {
    this.submissionService.getComments(submissionId).subscribe({
      next: (data) => {
        this.comments.set(data);
      },
      error: (err) => console.error('Failed to load comments', err),
    });
  }

  addComment(submissionId: number) {
    if (!this.newCommentText.trim()) return;

    this.submissionService.addComment(submissionId, this.newCommentText).subscribe({
      next: (comment) => {
        this.comments.update((others) => [comment, ...others]);
        this.newCommentText = '';
      },
      error: (err) => console.error('Failed to add comment', err),
    });
  }

  loadSubmissions() {
    this.submissionService.getSubmissionsByCandidate(String(this.candidateId)).subscribe({
      next: (data) => {
        // If jobId is present, filter
        let filtered = data;
        if (this.jobId) {
          filtered = data.filter((s) => s.jobId && String(s.jobId) === String(this.jobId));
        }
        this.submissions.set(
          filtered.sort(
            (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
          ),
        );
      },
      error: (err) => console.error('Failed to load submissions', err),
    });
  }

  loadClients() {
    this.clientService.getAllClients(0, 100).subscribe((page) => {
      this.clients.set(page.content || []);
    });
  }

  openAddModal() {
    this.dialog.open(AddClientSubmissionDialogComponent, {
      width: '500px',
      data: { 
        candidateId: this.candidateId, 
        jobId: this.jobId, 
        clients: this.clients() 
      },
      panelClass: 'dialog-modern'
    }).afterClosed().subscribe(result => {
      if (result) this.loadSubmissions();
    });
  }

  updateStatus(sub: ClientSubmission, status: ClientSubmissionStatus) {
    if (sub.status === status) return;
    
    this.dialogService.confirm(
      'Update Status', 
      `Are you sure you want to change status to ${this.formatStatus(status)}?`,
      'primary'
    ).subscribe(confirmed => {
      if (confirmed) {
        this.submissionService.updateStatus(sub.id, { status }).subscribe(() => {
          this.loadSubmissions();
        });
      }
    });
  }

  // --- Helpers ---

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  getStatusClass(status: ClientSubmissionStatus, isSelect = false): string {
    const base = isSelect ? 'font-medium ' : '';
    switch (status) {
      case 'SUBMITTED':
        return (
          base +
          (isSelect ? 'text-blue-800 bg-blue-50' : 'bg-blue-100 text-blue-800 border-blue-200')
        );
      case 'CLIENT_SCREENING':
        return (
          base +
          (isSelect
            ? 'text-purple-800 bg-purple-50'
            : 'bg-purple-100 text-purple-800 border-purple-200')
        );
      case 'CLIENT_INTERVIEW':
        return (
          base +
          (isSelect ? 'text-amber-800 bg-amber-50' : 'bg-amber-100 text-amber-800 border-amber-200')
        );
      case 'CLIENT_OFFERED':
        return (
          base +
          (isSelect ? 'text-green-800 bg-green-50' : 'bg-green-100 text-green-800 border-green-200')
        );
      case 'ONBOARDING':
        return (
          base +
          (isSelect ? 'text-teal-800 bg-teal-50' : 'bg-teal-100 text-teal-800 border-teal-200')
        );
      case 'CLIENT_REJECTED':
        return (
          base + (isSelect ? 'text-red-800 bg-red-50' : 'bg-red-100 text-red-800 border-red-200')
        );
      case 'WITHDRAWN':
        return (
          base +
          (isSelect ? 'text-gray-800 bg-gray-50' : 'bg-gray-100 text-gray-800 border-gray-200')
        );
      default:
        return base + 'bg-gray-100 text-gray-800';
    }
  }

  // --- Timeline Helpers ---

  getProgressWidth(currentStatus: ClientSubmissionStatus): string {
    // displayed steps: SUBMITTED, SCREENING, INTERVIEW, OFFERED
    // gaps: 3 (0->1, 1->2, 2->3)
    const visualSequence = ['SUBMITTED', 'CLIENT_SCREENING', 'CLIENT_INTERVIEW', 'CLIENT_OFFERED'];

    if (currentStatus === 'CLIENT_REJECTED' || currentStatus === 'WITHDRAWN') {
      // Ideally we show progress up to the last valid step, but simple for now
      return '0%';
    }

    if (currentStatus === 'ONBOARDING') {
      return '100%';
    }

    const idx = visualSequence.indexOf(currentStatus);
    if (idx === -1) return '0%';

    // Index 0 (Submitted) -> 0%
    // Index 1 (Screening) -> 1/3 = 33.33%
    // Index 2 (Interview) -> 2/3 = 66.66%
    // Index 3 (Offered)   -> 3/3 = 100%

    const gaps = visualSequence.length - 1; // 3
    const ratio = idx / gaps;

    return `calc((100% - 2.5rem) * ${ratio})`;
  }

  getStepIcon(stepStatus: string): string {
    switch (stepStatus) {
      case 'SUBMITTED':
        return 'bi-send';
      case 'CLIENT_SCREENING':
        return 'bi-search';
      case 'CLIENT_INTERVIEW':
        return 'bi-people';
      case 'CLIENT_OFFERED':
        return 'bi-trophy';
      default:
        return 'bi-circle';
    }
  }

  getStepClass(stepStatus: string, currentStatus: ClientSubmissionStatus): string {
    const sequence = ['SUBMITTED', 'CLIENT_SCREENING', 'CLIENT_INTERVIEW', 'CLIENT_OFFERED'];
    const currentIdx = sequence.indexOf(currentStatus);
    const stepIdx = sequence.indexOf(stepStatus);

    if (currentStatus === 'CLIENT_REJECTED' || currentStatus === 'WITHDRAWN') {
      const isPast = stepIdx <= 0; // Keeping it simple
      if (isPast) return 'bg-gray-100 border-gray-300 text-gray-500';
      return 'bg-white border-gray-200 text-gray-300';
    }

    if (stepIdx < currentIdx) {
      return 'bg-indigo-600 border-indigo-600 text-white shadow-sm scale-100'; // Completed
    } else if (stepIdx === currentIdx) {
      return 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50 shadow-md scale-110 font-bold'; // Active
    } else {
      return 'bg-white border-gray-300 text-gray-300'; // Future
    }
  }

  getLabelClass(stepStatus: string, currentStatus: string): string {
    const sequence = ['SUBMITTED', 'CLIENT_SCREENING', 'CLIENT_INTERVIEW', 'CLIENT_OFFERED'];
    if (stepStatus === currentStatus) return 'text-indigo-700 font-bold translate-y-1';
    if (sequence.indexOf(stepStatus) < sequence.indexOf(currentStatus))
      return 'text-gray-900 font-medium';
    return 'text-gray-400';
  }

  isStepActive(stepStatus: string, currentStatus: string): boolean {
    return stepStatus === currentStatus;
  }

  isStepCompleted(stepStatus: string, currentStatus: string): boolean {
    const sequence = ['SUBMITTED', 'CLIENT_SCREENING', 'CLIENT_INTERVIEW', 'CLIENT_OFFERED'];
    return sequence.indexOf(stepStatus) < sequence.indexOf(currentStatus);
  }
}
