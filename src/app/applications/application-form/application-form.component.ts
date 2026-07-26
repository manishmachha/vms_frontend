import { Component, Inject, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationService } from '../../services/application.service';
import { Job } from '../../models/job.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '../../services/auth.store';
import { CandidateService } from '../../candidates/services/candidate.service';
import { Candidate } from '../../candidates/models/candidate.model';
import { MatSelectModule } from '@angular/material/select';

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

  dialogRef = inject(MatDialogRef<ApplicationFormComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { job: Job }) {}

  currentStep = signal(0);
  steps = ['Personal', 'Experience', 'Resume'];
  isDragging = false;

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    location: [''],
    dob: [''],
    currentTitle: [''],
    currentCompany: [''],
    experienceYears: [0],
    linkedinUrl: [''],
    portfolioUrl: [''],
    skills: [[]],
  });

  candidateIdControl = this.fb.control<number | string | null>(null);

  selectedFile: File | null = null;
  fileError = '';

  // State
  candidates = signal<Candidate[]>([]);
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
      next: (page) => this.candidates.set(page.content || []),
      error: (err) => console.error('Failed to load candidates', err),
    });
  }

  onCandidateSelected(id: number | string | null) {
    if (!id) {
      // Reset form or keep as is? Maybe clear fields to allow manual entry?
      // Let's keep it simple: if ID is null, we assume New Candidate, but don't clear explicitly unless we stored original values
      // For now, no clear action. User edits manually.
      return;
    }

    const candidate = this.candidates().find((c) => String(c.id) === String(id));
    if (candidate) {
      this.form.patchValue({
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.city,
        currentTitle: candidate.currentDesignation,
        currentCompany: candidate.currentCompany,
        experienceYears: candidate.experienceYears || 0,
        linkedinUrl: candidate.linkedInUrl,
        portfolioUrl: candidate.portfolioUrl,
      });
      // Also set existing resume state if relevant
    }
  }

  hasExistingResume(): boolean {
    const id = this.candidateIdControl.value;
    if (!id) return false;
    const c = this.candidates().find((can) => String(can.id) === String(id));
    return !!c?.resumeFilePath;
  }

  nextStep() {
    if (this.currentStep() < this.steps.length - 1 && !this.isStepInvalid()) {
      this.currentStep.update((v) => v + 1);
    }
  }

  prevStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update((v) => v - 1);
    }
  }

  isStepInvalid(): boolean {
    if (this.currentStep() === 0) {
      return (
        this.form.get('firstName')?.invalid ||
        this.form.get('lastName')?.invalid ||
        this.form.get('email')?.invalid ||
        false
      );
    }
    // Professional step is mostly optional and has defaults
    return false;
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && (control?.dirty || control?.touched));
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Check if we have file OR Candidate ID
    if (!this.selectedFile && !this.candidateIdControl.value) {
      this.snackBar.open('Please upload a resume or select a candidate.', 'X', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    const formData = new FormData();
    const payload = {
      ...this.form.value,
      skills: [],
      candidateId: this.candidateIdControl.value, // Add candidateId
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
