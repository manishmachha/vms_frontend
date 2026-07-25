import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CandidateService } from '../../../services/candidate.service';
import { LoadingService } from '../../../services/loading.service';
import { Candidate } from '../../models/candidate.model';

@Component({
  selector: 'app-candidate-upload-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './candidate-upload-dialog.component.html',
  styleUrls: ['./candidate-upload-dialog.component.css']
})
export class CandidateUploadDialogComponent {
  private dialogRef = inject(MatDialogRef<CandidateUploadDialogComponent>);
  private candidateService = inject(CandidateService);
  private loadingService = inject(LoadingService);

  selectedFile = signal<File | null>(null);
  selectedSource = signal<string>('LinkedIn');
  otherSourceText = signal<string>('');
  uploadError = signal<string | null>(null);

  sources = ['LinkedIn', 'Naukri', 'Monster', 'Referral', 'Others'];

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

    this.candidateService.uploadResume(file, finalSource).subscribe({
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
