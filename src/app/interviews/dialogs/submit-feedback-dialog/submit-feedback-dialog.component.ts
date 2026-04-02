import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { InterviewService } from '../../../services/interview.service';

@Component({
  selector: 'app-submit-feedback-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <div class="dialog-container p-6">
      <div class="flex items-center justify-between mb-6 p-1">
        <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          <mat-icon class="text-emerald-600!">rate_review</mat-icon> 
          Submit Feedback
        </h3>
        <button mat-icon-button (click)="dialogRef.close()" class="text-gray-400 hover:text-gray-600 transition-colors">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="feedbackForm" (ngSubmit)="submitFeedback()" class="space-y-6">
        <div class="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 mb-4">
            <p class="text-sm text-emerald-900 font-medium mb-1">
                Interview with {{ data.interview?.application?.candidate?.firstName }} {{ data.interview?.application?.candidate?.lastName }}
            </p>
            <p class="text-xs text-emerald-700/70">
                {{ data.interview?.type }} Round - {{ data.interview?.scheduledAt | date:'medium' }}
            </p>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 text-center">Your Rating</label>
          <div class="flex justify-center gap-2">
            @for (star of [1,2,3,4,5]; track star) {
              <button 
                type="button"
                (click)="feedbackForm.patchValue({rating: star})"
                class="transition-all transform hover:scale-110"
              >
                <mat-icon 
                  [class.text-amber-400!]="(feedbackForm.get('rating')?.value ?? 0) >= star"
                  [class.text-gray-200!]="(feedbackForm.get('rating')?.value ?? 0) < star"
                  class="text-4xl! h-10! w-10!"
                >
                  star
                </mat-icon>
              </button>
            }
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Detailed Feedback</label>
          <textarea 
            formControlName="feedback" 
            rows="5"
            placeholder="Share your technical assessment, strengths, and areas for improvement..." 
            class="input-modern bg-gray-50/50 border-gray-100 hover:border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          ></textarea>
        </div>

        <div class="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
            <input 
                type="checkbox" 
                id="passed" 
                formControlName="passed"
                class="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            >
            <label for="passed" class="text-sm font-bold text-gray-700 cursor-pointer">
                Candidate passed this round
            </label>
        </div>

        <div class="flex justify-end gap-3 pt-6 border-t border-gray-50">
          <button
            type="button"
            (click)="dialogRef.close()"
            class="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="feedbackForm.invalid"
            class="px-8 py-2.5 bg-linear-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 font-bold transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none"
          >
            Submit Feedback
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host { display: block; width: 500px; }
  `]
})
export class SubmitFeedbackDialogComponent {
  private fb = inject(FormBuilder);
  private interviewService = inject(InterviewService);
  public dialogRef = inject(MatDialogRef<SubmitFeedbackDialogComponent>);
  public data = inject(MAT_DIALOG_DATA);

  feedbackForm = this.fb.group({
    feedback: ['', Validators.required],
    rating: [0, [Validators.required, Validators.min(1)]],
    passed: [true]
  });

  submitFeedback() {
    if (this.feedbackForm.invalid || !this.data.interview?.id) return;

    this.interviewService.submitFeedback(this.data.interview.id, this.feedbackForm.value as any).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => console.error('Failed to submit feedback', err)
    });
  }
}
