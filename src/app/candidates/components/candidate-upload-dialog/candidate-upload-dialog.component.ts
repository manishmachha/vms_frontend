import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CandidateService } from '../../../services/candidate.service';
import { LoadingService } from '../../../services/loading.service';
import { Candidate } from '../../models/candidate.model';
import { AuthStore } from '../../../services/auth.store';
import { JobService } from '../../../services/job.service';
import { Job } from '../../../models/job.model';

@Component({
  selector: 'app-candidate-upload-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './candidate-upload-dialog.component.html',
  styleUrls: ['./candidate-upload-dialog.component.css']
})
export class CandidateUploadDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CandidateUploadDialogComponent>);
  private candidateService = inject(CandidateService);
  private loadingService = inject(LoadingService);
  private authStore = inject(AuthStore);
  private jobService = inject(JobService);

  selectedFile = signal<File | null>(null);
  selectedSource = signal<string>('LinkedIn');
  otherSourceText = signal<string>('');
  uploadError = signal<string | null>(null);

  jobs = signal<Job[]>([]);
  selectedJobId = signal<string | null>(null);
  applyToJob = signal<boolean>(false);

  sources = ['LinkedIn', 'Naukri', 'Monster', 'Referral', 'Others'];

  ngOnInit() {
    const user = this.authStore.user();
    if (user?.organizationName) {
      // Insert the organization name before 'Others'
      this.sources.splice(this.sources.length - 1, 0, user.organizationName);
    }
    this.jobService.getJobs(0, 100).subscribe((res) => {
      this.jobs.set(res.content);
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
      this.uploadError.set(null);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.selectedFile.set(event.dataTransfer.files[0]);
      this.uploadError.set(null);
    }
  }

  removeFile() {
    this.selectedFile.set(null);
  }

  onSubmit() {
    const file = this.selectedFile();
    if (!file) {
      this.uploadError.set('Please select a resume file first.');
      return;
    }

    let finalSource = this.selectedSource();
    if (finalSource === 'Others') {
      finalSource = this.otherSourceText().trim();
      if (!finalSource) {
        this.uploadError.set('Please specify the source.');
        return;
      }
    }

    this.uploadError.set(null);
    this.loadingService.show();

    this.candidateService.uploadResume(file, finalSource, this.selectedJobId(), this.applyToJob()).subscribe({
      next: (candidate: Candidate) => {
        this.loadingService.hide();
        this.dialogRef.close(candidate);
      },
      error: (err) => {
        this.loadingService.hide();
        console.error('Upload failed', err);
        this.uploadError.set('Failed to upload/parse resume. Please try again.');
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
