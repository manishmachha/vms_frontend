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
import { ProjectService } from '../../../services/project.service';
import { Client } from '../../../models/client.model';
import { Project } from '../../../models/project.model';

@Component({
  selector: 'app-add-project-modal',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatIconModule, 
    MatButtonModule
  ],
  templateUrl: './add-project-dialog.component.html',
  styleUrls: ['./add-project-dialog.component.css'],
})
export class AddProjectDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  public dialogRef = inject(MatDialogRef<AddProjectDialogComponent>);
  public data = inject(MAT_DIALOG_DATA); // Expects { clients: Client[], editProject: Project | null }

  projectForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    clientId: [null as string | number | null],
    startDate: [''],
    endDate: [''],
    requestId: [''],
    billRate: [null as number | null],
    payRate: [null as number | null],
  });

  ngOnInit() {
    if (this.data.editProject) {
      this.projectForm.patchValue({
        name: this.data.editProject.name,
        description: this.data.editProject.description || '',
        clientId: this.data.editProject.client?.id || null,
        startDate: this.data.editProject.startDate || '',
        endDate: this.data.editProject.endDate || '',
        requestId: this.data.editProject.requestId || '',
        billRate: this.data.editProject.billRate || null,
        payRate: this.data.editProject.payRate || null,
      });
    }
  }

  saveProject() {
    if (this.projectForm.valid) {
      const formVal = this.projectForm.value;
      const payload: any = {
        name: formVal.name,
        description: formVal.description,
        startDate: formVal.startDate,
        endDate: formVal.endDate,
        requestId: formVal.requestId || undefined,
        billRate: formVal.billRate || undefined,
        payRate: formVal.payRate || undefined,
        clientId: formVal.clientId ? formVal.clientId : undefined,
      };

      const request$ = this.data.editProject
        ? this.projectService.updateProject(this.data.editProject.id, payload)
        : this.projectService.createProject(payload);

      request$.subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (err: any) => {
          console.error(err);
        },
      });
    }
  }

  onClose() {
    this.dialogRef.close();
  }
}
