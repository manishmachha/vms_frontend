import {
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProjectService, AllocateUserRequest } from '../../../services/project.service';
import { DialogService } from '../../../services/dialog.service';
import { CandidateService } from '../../../services/candidate.service';
import { Candidate } from '../../../candidates/models/candidate.model';
import { signal } from '@angular/core';

@Component({
  selector: 'app-allocate-resource-modal',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatIconModule, 
    MatButtonModule
  ],
  templateUrl: './allocate-resource-modal.component.html',
  styleUrls: ['./allocate-resource-modal.component.css'],
})
export class AllocateResourceModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private dialogService = inject(DialogService);
  public dialogRef = inject(MatDialogRef<AllocateResourceModalComponent>);
  public data = inject(MAT_DIALOG_DATA);
  private candidateService = inject(CandidateService);

  candidates = signal<Candidate[]>([]);

  allocateForm = this.fb.group({
    candidateId: ['', Validators.required],
    startDate: ['', Validators.required],
    percentage: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    billingRole: [''],
  });

  ngOnInit() {
    this.allocateForm.reset({ percentage: 100 });
    
    if (this.data.candidates && this.data.candidates.length > 0) {
      this.candidates.set(this.data.candidates);
    } else {
      this.candidateService.getCandidates(0, 500).subscribe((page) => {
        this.candidates.set(page.content || []);
      });
    }
  }

  allocateUser() {
    if (this.allocateForm.valid && this.data.projectId) {
      const val = this.allocateForm.value;
      const req: AllocateUserRequest = {
        candidateId: Number(val.candidateId),
        startDate: val.startDate!,
        percentage: val.percentage!,
        billingRole: val.billingRole || undefined,
      };

      this.projectService.allocateUser(this.data.projectId, req).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: () => {
          console.error('Failed to allocate resource');
        },
      });
    }
  }

  onClose() {
    this.dialogRef.close();
  }
}
