import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ClientSubmissionService } from '../../../services/client-submission.service';

@Component({
  selector: 'app-add-client-submission-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <mat-icon class="text-indigo-600!">send</mat-icon>
          Submit to Client
        </h2>
        <button mat-icon-button (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="submissionForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Select Client</label>
          <select 
            formControlName="clientId" 
            class="input-modern bg-gray-50 border-gray-100 hover:border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          >
            <option value="" disabled>Choose a client...</option>
            <option *ngFor="let client of data.clients" [value]="client.id">
              {{ client.name }}
            </option>
          </select>
          @if (submissionForm.get('clientId')?.touched && submissionForm.get('clientId')?.invalid) {
            <p class="text-red-500 text-xs mt-1 px-1">Client selection is required</p>
          }
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">External Reference ID (Optional)</label>
          <input 
            type="text" 
            formControlName="externalReferenceId" 
            placeholder="e.g. Client's Internal Req ID"
            class="input-modern bg-gray-50 border-gray-100 hover:border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          >
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Remarks</label>
          <textarea 
            formControlName="remarks" 
            rows="3" 
            placeholder="Add any additional context or notes for this submission..."
            class="input-modern bg-gray-50 border-gray-100 hover:border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 resize-none"
          ></textarea>
        </div>

        <div class="flex gap-3 pt-4">
          <button 
            type="button" 
            mat-stroked-button 
            (click)="onClose()" 
            class="flex-1 h-[52px]! rounded-2xl! border-2 font-bold text-gray-500 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            mat-flat-button 
            color="primary" 
            [disabled]="submissionForm.invalid || isSubmitting"
            class="flex-1 h-[52px]! rounded-2xl! font-bold shadow-indigo-200/50 shadow-lg"
          >
            {{ isSubmitting ? 'Submitting...' : 'Confirm Submission' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    @reference "tailwindcss";
    :host { display: block; }
    .input-modern {
      @apply w-full px-4 py-3 rounded-2xl border-2 border-transparent transition-all outline-none;
    }
  `]
})
export class AddClientSubmissionDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private submissionService = inject(ClientSubmissionService);
  public dialogRef = inject(MatDialogRef<AddClientSubmissionDialogComponent>);
  public data = inject(MAT_DIALOG_DATA); // { candidateId, jobId, clients }

  submissionForm = this.fb.group({
    clientId: ['', Validators.required],
    externalReferenceId: [''],
    remarks: [''],
  });

  isSubmitting = false;

  ngOnInit() {
    this.submissionForm.reset({ clientId: '' });
  }

  onSubmit() {
    if (this.submissionForm.invalid) return;

    this.isSubmitting = true;
    const val = this.submissionForm.value;

    this.submissionService.createSubmission({
      candidateId: this.data.candidateId,
      clientId: val.clientId!,
      jobId: this.data.jobId ? this.data.jobId : undefined,
      externalReferenceId: val.externalReferenceId || undefined,
      remarks: val.remarks || undefined,
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.dialogRef.close(true);
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  onClose() {
    this.dialogRef.close();
  }
}
