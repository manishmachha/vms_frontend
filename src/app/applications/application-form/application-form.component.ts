import { Component, Inject, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApplicationService } from '../../services/application.service';
import { Job } from '../../models/job.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '../../services/auth.store';
import { CandidateService } from '../../candidates/services/candidate.service';
import { Candidate } from '../../candidates/models/candidate.model';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSelectModule],
  templateUrl: './application-form.component.html',
  styleUrls: ['./application-form.component.css'],
})
export class ApplicationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private appService = inject(ApplicationService);
  private snackBar = inject(MatSnackBar);
  private authStore = inject(AuthStore);
  private candidateService = inject(CandidateService);
  private router = inject(Router);

  dialogRef = inject(MatDialogRef<ApplicationFormComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { job: Job }) {}

  isDragging = false;
  candidateIdControl = this.fb.control<number | string | null>(null);

  selectedFile: File | null = null;
  fileError = '';

  // State
  candidates = signal<Candidate[]>([]);
  selectedCandidate = signal<Candidate | null>(null);
  isVendor = signal(false);

  ngOnInit() {
    this.isVendor.set(this.authStore.userRole() === 'VENDOR');
    
    this.loadCandidates();

    // Listen to changes
    this.candidateIdControl.valueChanges.subscribe((id) => {
      this.onCandidateSelected(id);
    });
  }

  loadCandidates() {
    this.candidateService.getCandidates(0, 100).subscribe({
      next: (page) => {
        this.candidates.set(page.content || []);
      },
      error: (err) => console.error('Failed to load candidates', err),
    });
  }

  onCandidateSelected(id: number | string | null) {
    if (!id) {
      this.selectedCandidate.set(null);
      return;
    }
    const candidate = this.candidates().find((c) => String(c.id) === String(id));
    this.selectedCandidate.set(candidate || null);
  }

  hasExistingResume(): boolean {
    return !!this.selectedCandidate()?.resumeFilePath;
  }

  goToCandidates() {
    this.dialogRef.close();
    this.router.navigate(['/candidates']);
  }

  // File Handling
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files.length) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: any) {
    if (event.target.files.length) {
      this.handleFile(event.target.files[0]);
    }
  }

  handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      this.fileError = 'File size must be less than 5MB';
      this.selectedFile = null;
    } else {
      this.selectedFile = file;
      this.fileError = '';
    }
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    this.fileError = '';
  }

  submit() {
    if (!this.candidateIdControl.value) {
      this.snackBar.open('Please select a candidate.', 'X', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    const formData = new FormData();
    const payload = {
      candidateId: this.candidateIdControl.value,
      skills: [],
    };

    formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    if (this.selectedFile) {
      formData.append('resume', this.selectedFile);
    }

    this.appService.apply(this.data.job.id, formData).subscribe({
      next: () => {
        this.snackBar.open('Application submitted successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open(err.error?.message || 'Failed to submit application', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }
}

