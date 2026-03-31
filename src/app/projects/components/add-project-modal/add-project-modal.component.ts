import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService } from '../../../services/project.service';
import { Client } from '../../../models/client.model';
import { Project } from '../../../models/project.model';
import { ModalComponent } from '../../../layout/components/modal/modal.component';

@Component({
  selector: 'app-add-project-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="editProject ? 'Edit Project' : 'New Project'"
      (isOpenChange)="onClose()"
    >
      <form [formGroup]="projectForm" (ngSubmit)="saveProject()" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Project Name</label>
          <input formControlName="name" class="input-modern" placeholder="Project Alpha" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            formControlName="description"
            rows="3"
            class="input-modern resize-none"
            placeholder="Brief project description..."
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Client (Optional)</label>
          <select formControlName="clientId" class="input-modern bg-white">
            <option value="">-- Internal Project --</option>
            <option *ngFor="let client of clients" [value]="client.id">
              {{ client.name }}
            </option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
            <input type="date" formControlName="startDate" class="input-modern" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
            <input type="date" formControlName="endDate" class="input-modern" />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Request ID</label>
            <input type="text" formControlName="requestId" class="input-modern" placeholder="REQ-001" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Bill Rate</label>
            <input type="number" formControlName="billRate" class="input-modern" placeholder="0.00" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Pay Rate</label>
            <input type="number" formControlName="payRate" class="input-modern" placeholder="0.00" />
          </div>
        </div>

        <div class="pt-4 flex gap-3">
          <button
            type="button"
            (click)="onClose()"
            class="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="projectForm.invalid"
            class="flex-1 btn-primary py-3 px-4 rounded-xl font-medium disabled:opacity-50 flex justify-center items-center gap-2"
          >
            <span>{{ editProject ? 'Update Project' : 'Create Project' }}</span>
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class AddProjectModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() clients: Client[] = [];
  @Input() editProject: Project | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);


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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.projectForm.reset();

      if (this.editProject) {
        // Editing existing project
        this.projectForm.patchValue({
          name: this.editProject.name,
          description: this.editProject.description || '',
          clientId: this.editProject.client?.id || null,
          startDate: this.editProject.startDate || '',
          endDate: this.editProject.endDate || '',
          requestId: this.editProject.requestId || '',
          billRate: this.editProject.billRate || null,
          payRate: this.editProject.payRate || null,
        });
      } else {
        // Creating new project
        this.projectForm.patchValue({ clientId: null });
      }
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
        clientId: formVal.clientId ? Number(formVal.clientId) : undefined,
      };

      const request$ = this.editProject
        ? this.projectService.updateProject(this.editProject.id, payload)
        : this.projectService.createProject(payload);

      request$.subscribe({
        next: () => {
          this.saved.emit();
          this.onClose();
        },
        error: (err: any) => {
          console.error(err);
        },
      });
    }
  }

  onClose() {
    this.close.emit();
  }
}
